/**
 * SleepALot — data seeder
 * ------------------------------------------------------------------
 * Generates realistic demo data:
 *   - N customer auth users (+ profiles), all with the same demo password
 *   - a catalogue of mattress / sleep products
 *   - product reviews (including ONE benign "XSS canary" review so you can
 *     demonstrate stored XSS without writing anything nasty yourself)
 *   - orders + order_items for each user
 *
 * Uses the SERVICE ROLE key, so it bypasses RLS and can create auth users.
 * The service role key must NEVER ship to the browser — this script runs
 * only on your machine from the terminal.
 *
 * Usage:
 *   1. cp .env.example .env   and fill in the two values
 *   2. npm install
 *   3. npm run seed
 */
import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'
import 'dotenv/config'

const URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SERVICE_KEY) {
  console.error('\nMissing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in seed/.env\n')
  process.exit(1)
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const N_USERS = 12
const DEMO_PASSWORD = 'Password123!'

// A fixed set of believable sleep-store products.
// 5th field = image keyword(s) for the (bed/sleep-themed) product photo.
const PRODUCTS = [
  ['CloudNine Memory Foam Mattress', 'Queen memory-foam mattress with a cooling gel top layer for a deeper sleep.', 8499.0, 25, 'mattress,bed'],
  ['DreamCoil Pocket-Spring Mattress', 'Individually wrapped pocket springs that reduce partner disturbance.', 10999.0, 18, 'mattress,bedroom'],
  ['SleepALot Signature Pillow', 'Adjustable loft memory-foam pillow with a bamboo cover.', 799.0, 120, 'pillow,bed'],
  ['Arctic Cool Gel Pillow', 'Temperature-regulating gel pillow for hot sleepers.', 949.0, 90, 'pillow'],
  ['Hush Weighted Blanket 7kg', 'Calming weighted blanket to help you drift off faster.', 1499.0, 60, 'blanket,bed'],
  ['Linen Bliss Duvet Set (Queen)', '100% stonewashed linen duvet cover set, breathable all year round.', 1899.0, 40, 'duvet,bedding'],
  ['NightOwl Blackout Curtains', 'Thermal blackout curtains that block 99% of light.', 699.0, 75, 'curtains,bedroom'],
  ['Slumber Silk Eye Mask', 'Mulberry-silk contoured eye mask with an adjustable strap.', 299.0, 200, 'sleep,mask'],
  ['Rise & Shine Sunrise Alarm', 'Wake-up light that simulates a natural sunrise.', 1299.0, 33, 'alarm,clock'],
  ['DeepRest Mattress Topper', 'Plush 5cm memory-foam topper to refresh a tired mattress.', 1799.0, 22, 'mattress,bedroom'],
  ['Bamboo Breeze Sheet Set', 'Silky-soft bamboo-viscose sheets, moisture-wicking.', 1099.0, 50, 'bedsheets,bedding'],
  ['Little Dreamer Cot Mattress', 'Hypoallergenic cot mattress for babies and toddlers.', 1599.0, 15, 'crib,cot'],
]

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function wipe() {
  console.log('Clearing existing demo rows...')
  await admin.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  // profiles are removed via auth user deletion below
}

async function deleteDemoAuthUsers() {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const demo = (data?.users || []).filter(u => u.email?.endsWith('@sleepalot.test'))
  for (const u of demo) await admin.auth.admin.deleteUser(u.id)
  if (demo.length) console.log(`Removed ${demo.length} previous demo users.`)
}

async function seedProducts() {
  console.log('Inserting products...')
  const rows = PRODUCTS.map(([name, description, price, stock, keyword], i) => ({
    name,
    slug: slugify(name),
    description,
    price,
    stock,
    // Bed/sleep-themed photo by keyword (loremflickr); lock keeps it stable.
    image_url: `https://loremflickr.com/600/400/${keyword}?lock=${i + 1}`,
  }))
  const { data, error } = await admin.from('products').insert(rows).select()
  if (error) throw error
  return data
}

async function seedUsers() {
  console.log(`Creating ${N_USERS} customer users (password: ${DEMO_PASSWORD})...`)
  const users = []
  for (let i = 0; i < N_USERS; i++) {
    const first = faker.person.firstName()
    const last = faker.person.lastName()
    const email = `${first}.${last}.${i}`.toLowerCase().replace(/[^a-z0-9.]/g, '') + '@sleepalot.test'
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `${first} ${last}` },
    })
    if (error) { console.warn('  skip', email, error.message); continue }
    const user = data.user
    await admin.from('profiles').insert({
      id: user.id,
      email,
      full_name: `${first} ${last}`,
      role: i === 0 ? 'admin' : 'customer', // first user is an admin, for demos
    })
    users.push({ id: user.id, email, name: `${first} ${last}` })
  }
  console.log(`  created ${users.length} users. First user is ADMIN: ${users[0]?.email}`)
  return users
}

async function seedReviews(products, users) {
  console.log('Inserting reviews...')
  const rows = []
  for (const p of products) {
    const n = faker.number.int({ min: 1, max: 4 })
    for (let i = 0; i < n; i++) {
      const u = faker.helpers.arrayElement(users)
      rows.push({
        product_id: p.id,
        user_id: u.id,
        author_name: u.name,
        rating: faker.number.int({ min: 3, max: 5 }),
        body: faker.helpers.arrayElement([
          'Sleeping so much better since I got this. Highly recommend!',
          'Good quality for the price. Delivery was quick.',
          'Comfortable but took a few nights to get used to.',
          'Exactly as described. Would buy again.',
          'My partner and I both love it.',
        ]),
      })
    }
  }
  // ONE benign stored-XSS canary review on the first product.
  // It only pops a harmless alert if the app renders review HTML unsafely.
  rows.push({
    product_id: products[0].id,
    user_id: users[0].id,
    author_name: 'pentester',
    rating: 5,
    body: '<img src=x onerror="alert(\'XSS-by-pentester\')">Great mattress!',
  })
  const { error } = await admin.from('reviews').insert(rows)
  if (error) throw error
  console.log(`  inserted ${rows.length} reviews (incl. 1 XSS canary on "${products[0].name}").`)
}

async function seedOrders(products, users) {
  console.log('Inserting orders...')
  let orderCount = 0
  for (const u of users) {
    const n = faker.number.int({ min: 1, max: 3 })
    for (let o = 0; o < n; o++) {
      const items = faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 3 }))
      let total = 0
      const itemRows = items.map(p => {
        const qty = faker.number.int({ min: 1, max: 2 })
        total += Number(p.price) * qty
        return { product_id: p.id, quantity: qty, unit_price: p.price }
      })
      const { data: order, error } = await admin.from('orders').insert({
        user_id: u.id,
        total,
        status: faker.helpers.arrayElement(['paid', 'shipped', 'delivered']),
        shipping_address: `${faker.location.streetAddress()}, ${faker.location.city()}`,
      }).select().single()
      if (error) throw error
      await admin.from('order_items').insert(itemRows.map(r => ({ ...r, order_id: order.id })))
      orderCount++
    }
  }
  console.log(`  inserted ${orderCount} orders.`)
}

async function main() {
  console.log('=== SleepALot seeder ===')
  await deleteDemoAuthUsers()
  await wipe()
  const products = await seedProducts()
  const users = await seedUsers()
  await seedReviews(products, users)
  await seedOrders(products, users)
  console.log('\nDone. Log in with any *@sleepalot.test email and password:', DEMO_PASSWORD)
  console.log('Tip: note two different users\' emails — you\'ll need them to demo IDOR.\n')
}

main().catch(e => { console.error(e); process.exit(1) })
