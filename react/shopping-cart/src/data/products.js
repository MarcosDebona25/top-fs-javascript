// Catálogo local de productos: mapea el `id` de Fake Store API a un nombre legible y a la imagen local correspondiente (assets/img_products).
import img1 from '../assets/img_products/product-1.webp'
import img2 from '../assets/img_products/product-2.webp'
import img3 from '../assets/img_products/product-3.webp'
import img4 from '../assets/img_products/product-4.webp'
import img5 from '../assets/img_products/product-5.webp'
import img6 from '../assets/img_products/product-6.webp'
import img7 from '../assets/img_products/product-7.webp'
import img8 from '../assets/img_products/product-8.webp'
import img9 from '../assets/img_products/product-9.webp'
import img10 from '../assets/img_products/product-10.webp'
import img11 from '../assets/img_products/product-11.webp'
import img12 from '../assets/img_products/product-12.webp'
import img13 from '../assets/img_products/product-13.webp'
import img14 from '../assets/img_products/product-14.webp'
import img15 from '../assets/img_products/product-15.webp'
import img16 from '../assets/img_products/product-16.webp'
import img17 from '../assets/img_products/product-17.webp'
import img18 from '../assets/img_products/product-18.webp'
import img19 from '../assets/img_products/product-19.webp'
import img20 from '../assets/img_products/product-20.webp'

export const productCatalog = {
  1: { name: 'Fjällräven Backpack', image: img1 },
  2: { name: 'Casual Slim Fit T-Shirt', image: img2 },
  3: { name: 'Cotton Jacket', image: img3 },
  4: { name: 'Casual Slim Fit Shirt', image: img4 },
  5: { name: 'Gold & Silver Dragon Bracelet', image: img5 },
  6: { name: 'Gold Micropave Ring', image: img6 },
  7: { name: 'White Gold Princess Ring', image: img7 },
  8: { name: 'Rose Gold Owl Earrings', image: img8 },
  9: { name: 'WD 2TB Portable Hard Drive', image: img9 },
  10: { name: 'SanDisk 1TB Internal SSD', image: img10 },
  11: { name: 'Silicon Power 256GB SSD', image: img11 },
  12: { name: 'WD 4TB Gaming Drive', image: img12 },
  13: { name: 'Acer 21.5" Full HD Monitor', image: img13 },
  14: { name: 'Samsung 49" Curved Monitor', image: img14 },
  15: { name: '3-in-1 Snowboard Jacket', image: img15 },
  16: { name: 'Faux Leather Moto Jacket', image: img16 },
  17: { name: 'Striped Windbreaker Jacket', image: img17 },
  18: { name: 'Boat Neck T-Shirt', image: img18 },
  19: { name: 'Moisture-Wicking T-Shirt', image: img19 },
  20: { name: 'Casual Cotton T-Shirt', image: img20 },
}

// Devuelve el nombre y la imagen local de un producto, o null si no existe.
export function getProductMeta(id) {
  return productCatalog[id] ?? null
}
