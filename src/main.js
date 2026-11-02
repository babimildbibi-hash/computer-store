
import './style.css'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)

const app = document.querySelector('#app')

let products = []
let categories = []
let customers = []
let orders = []
let cart = []

const menu = {
  dashboard: 'ภาพรวม',
  products: 'สินค้า',
  categories: 'หมวดหมู่',
  customers: 'ลูกค้า',
  sales: 'ขายสินค้า',
  orders: 'ประวัติการขาย'
}

const money = n =>
  Number(n || 0).toLocaleString('th-TH') + ' บาท'

function layout(page) {
  app.innerHTML = `
    <aside>
      <h2>🖥 COMPUTER STORE</h2>
      <p>ระบบจัดการร้านค้า</p>
      ${Object.keys(menu).map(key => `
        <button onclick="show('${key}')">
          ${menu[key]}
        </button>
      `).join('')}
    </aside>

    <main>
      <h1>${menu[page]}</h1>
      <div id="content"></div>
    </main>
  `
}

function table(headers, rows) {
  return `
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>${row.map(v => `<td>${v}</td>`).join('')}</tr>
        `).join('')}
      </tbody>
    </table>
  `
}

window.show = async function(page) {
  layout(page)

  const content = document.querySelector('#content')

  if (page === 'dashboard') {
    content.innerHTML = `
      <div class="cards">
        <div class="card">สินค้าทั้งหมด<h2>${products.length}</h2></div>
        <div class="card">ลูกค้าทั้งหมด<h2>${customers.length}</h2></div>
        <div class="card">หมวดหมู่<h2>${categories.length}</h2></div>
        <div class="card">ยอดขาย<h2>${money(orders.reduce((s,o)=>s+Number(o.total||0),0))}</h2></div>
      </div>
    `
  }

  if (page === 'products') {
    content.innerHTML = `
      <div class="card">
        <button onclick="addProduct()">+ เพิ่มสินค้า</button>
        ${table(
          ['รหัส','ชื่อสินค้า','ราคา','จำนวน',''],
          products.map(p => [
            p.product_id,
            p.product_name,
            money(p.price),
            p.stock,
            `<button onclick="deleteProduct(${p.product_id})">ลบ</button>`
          ])
        )}
      </div>
    `
  }

  if (page === 'categories') {
    content.innerHTML = `
      <div class="card">
        <button onclick="addCategory()">+ เพิ่มหมวดหมู่</button>
        ${table(
          ['รหัส','ชื่อหมวดหมู่'],
          categories.map(c => [c.category_id,c.category_name])
        )}
      </div>
    `
  }

  if (page === 'customers') {
    content.innerHTML = `
      <div class="card">
        <button onclick="addCustomer()">+ เพิ่มลูกค้า</button>
        ${table(
          ['รหัส','ชื่อ','เบอร์โทร'],
          customers.map(c => [
            c.customer_id,
            c.customer_name,
            c.phone || '-'
          ])
        )}
      </div>
    `
  }

  if (page === 'sales') {
    content.innerHTML = `
      <div class="card">
        <h2>ขายสินค้า</h2>

        <label>สินค้า</label>
        <select id="productSelect">
          ${products.filter(p=>p.stock>0).map(p=>`
            <option value="${p.product_id}">
              ${p.product_name} - ${money(p.price)}
            </option>
          `).join('')}
        </select>

        <label>จำนวน</label>
        <input id="quantity" type="number" value="1" min="1">

        <button onclick="addCart()">เพิ่มสินค้า</button>

        <div id="cartList"></div>
      </div>
    `
    drawCart()
  }

  if (page === 'orders') {
    content.innerHTML = `
      <div class="card">
        ${table(
          ['เลขที่','วันที่','ยอดรวม'],
          orders.map(o => [
            o.order_id,
            o.order_date,
            money(o.total)
          ])
        )}
      </div>
    `
  }
}

window.addProduct = async function() {
  const name = prompt('ชื่อสินค้า')
  const price = Number(prompt('ราคา'))
  const stock = Number(prompt('จำนวนสินค้า'))

  if (!name || price < 0 || stock < 0) return

  const { error } = await supabase.from('products').insert({
    product_name: name,
    price,
    stock
  })

  if (error) return alert(error.message)

  await loadData()
  show('products')
}

window.deleteProduct = async function(id) {
  if (!confirm('ต้องการลบสินค้านี้?')) return

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('product_id', id)

  if (error) return alert(error.message)

  await loadData()
  show('products')
}

window.addCategory = async function() {
  const name = prompt('ชื่อหมวดหมู่')
  if (!name) return

  const { error } = await supabase.from('categories').insert({
    category_name: name
  })

  if (error) return alert(error.message)

  await loadData()
  show('categories')
}

window.addCustomer = async function() {
  const name = prompt('ชื่อลูกค้า')
  const phone = prompt('เบอร์โทร')

  if (!name) return

  const { error } = await supabase.from('customers').insert({
    customer_name: name,
    phone
  })

  if (error) return alert(error.message)

  await loadData()
  show('customers')
}

window.addCart = function() {
  const id = Number(document.querySelector('#productSelect').value)
  const qty = Number(document.querySelector('#quantity').value)

  const p = products.find(x => x.product_id === id)

  if (!p || qty < 1 || qty > p.stock) {
    return alert('จำนวนสินค้าไม่ถูกต้อง')
  }

  cart.push({
    product_id: p.product_id,
    name: p.product_name,
    price: p.price,
    quantity: qty
  })

  drawCart()
}

function drawCart() {
  const box = document.querySelector('#cartList')
  if (!box) return

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  box.innerHTML = `
    ${table(
      ['สินค้า','จำนวน','ราคา'],
      cart.map(item => [
        item.name,
        item.quantity,
        money(item.price * item.quantity)
      ])
    )}

    <h2>รวม ${money(total)}</h2>
    <button onclick="checkout()">ยืนยันการขาย</button>
  `
}

window.checkout = async function() {
  if (!cart.length) return alert('ไม่มีสินค้าในตะกร้า')

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const { data: order, error } = await supabase
    .from('orders')
    .insert({ total })
    .select()
    .single()

  if (error) return alert(error.message)

  const details = cart.map(item => ({
    order_id: order.order_id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price
  }))

  const { error: detailError } = await supabase
    .from('order_details')
    .insert(details)

  if (detailError) return alert(detailError.message)

  for (const item of cart) {
    const p = products.find(x => x.product_id === item.product_id)

    await supabase.from('products')
      .update({ stock: p.stock - item.quantity })
      .eq('product_id', p.product_id)
  }

  cart = []

  alert('ขายสินค้าสำเร็จ')

  await loadData()
  show('orders')
}

async function loadData() {
  const p = await supabase.from('products').select('*')
  const c = await supabase.from('categories').select('*')
  const u = await supabase.from('customers').select('*')
  const o = await supabase.from('orders').select('*')

  if (p.error) return alert(p.error.message)
  if (c.error) return alert(c.error.message)
  if (u.error) return alert(u.error.message)
  if (o.error) return alert(o.error.message)

  products = p.data
  categories = c.data
  customers = u.data
  orders = o.data

  show('dashboard')
}

loadData()
window.show = show
