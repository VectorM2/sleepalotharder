-- Update existing product images to bed/sleep-themed photos.
-- Run in the Supabase SQL Editor if your products were seeded with the old (random) images.

update public.products set image_url = 'https://loremflickr.com/600/400/mattress,bed?lock=1' where name = 'CloudNine Memory Foam Mattress';
update public.products set image_url = 'https://loremflickr.com/600/400/mattress,bedroom?lock=2' where name = 'DreamCoil Pocket-Spring Mattress';
update public.products set image_url = 'https://loremflickr.com/600/400/pillow,bed?lock=3' where name = 'SleepALot Signature Pillow';
update public.products set image_url = 'https://loremflickr.com/600/400/pillow?lock=4' where name = 'Arctic Cool Gel Pillow';
update public.products set image_url = 'https://loremflickr.com/600/400/blanket,bed?lock=5' where name = 'Hush Weighted Blanket 7kg';
update public.products set image_url = 'https://loremflickr.com/600/400/duvet,bedding?lock=6' where name = 'Linen Bliss Duvet Set (Queen)';
update public.products set image_url = 'https://loremflickr.com/600/400/curtains,bedroom?lock=7' where name = 'NightOwl Blackout Curtains';
update public.products set image_url = 'https://loremflickr.com/600/400/sleep,mask?lock=8' where name = 'Slumber Silk Eye Mask';
update public.products set image_url = 'https://loremflickr.com/600/400/alarm,clock?lock=9' where name = 'Rise & Shine Sunrise Alarm';
update public.products set image_url = 'https://loremflickr.com/600/400/mattress,bedroom?lock=10' where name = 'DeepRest Mattress Topper';
update public.products set image_url = 'https://loremflickr.com/600/400/bedsheets,bedding?lock=11' where name = 'Bamboo Breeze Sheet Set';
update public.products set image_url = 'https://loremflickr.com/600/400/crib,cot?lock=12' where name = 'Little Dreamer Cot Mattress';
