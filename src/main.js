import { createClient } from '@supabase/supabase-js'
import './style.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// สลับหน้าจอเมนู
window.show = function(pageId) {
    document.querySelectorAll('main > div').forEach(div => div.style.display = 'none');
    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    
    // โหลดข้อมูลตามหน้า
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'products') loadProducts();
    if (pageId === 'categories') loadCategories();
    if (pageId === 'customers') loadCustomers();
    if (pageId === 'sales') loadSalesProducts();
    if (pageId === 'orders') loadOrders();
}

// โหลดหน้าแรกเริ่มต้น
window.onload = () => {
    window.show('dashboard');
};

// 1. DASHBOARD
async function loadDashboard() {
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    const { data: orders } = await supabase.from('orders').select('*');
    
    let totalSales = orders ? orders.reduce((sum, o) => sum + (o.total_price || 0), 0) : 0;

    document.getElementById('content').innerHTML = `
        <h2>ภาพรวมระบบ</h2>
        <div style="display: flex; gap: 20px; margin-top: 20px;">
            <div style="background: white; padding: 20px; border-radius: 8px; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3>สินค้าทั้งหมด</h3>
                <p style="font-size: 24px; font-weight: bold; color: #3b82f6;">${prodCount || 0} รายการ</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3>ลูกค้าทั้งหมด</h3>
                <p style="font-size: 24px; font-weight: bold; color: #10b981;">${custCount || 0} คน</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3>ยอดขายรวม</h3>
                <p style="font-size: 24px; font-weight: bold; color: #f59e0b;">${totalSales.toLocaleString()} บาท</p>
            </div>
        </div>
    `;
}

// 2. จัดการสินค้า (Products)
async function loadProducts() {
    const { data: products } = await supabase.from('products').select('*, categories(category_name)');
    const { data: categories } = await supabase.from('categories').select('*');

    document.getElementById('content').innerHTML = `
        <h2>จัดการสินค้า</h2>
        <form id="prod-form" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 10px;">
            <input type="text" id="p-name" placeholder="ชื่อสินค้า" required style="padding: 8px; flex: 2;">
            <input type="number" id="p-price" placeholder="ราคา" required style="padding: 8px; flex: 1;">
            <input type="number" id="p-stock" placeholder="จำนวนสต็อก" required style="padding: 8px; flex: 1;">
            <select id="p-cat" style="padding: 8px; flex: 1;">
                ${categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('')}
            </select>
            <button type="submit" style="background: #3b82f6; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">เพิ่มสินค้า</button>
        </form>
        <table border="1" style="width: 100%; background: white; border-collapse: collapse; text-align: left;">
            <tr style="background: #f1f5f9;"><th style="padding: 10px;">ชื่อสินค้า</th><th>ราคา</th><th>สต็อก</th><th>หมวดหมู่</th><th>จัดการ</th></tr>
            ${products.map(p => `
                <tr>
                    <td style="padding: 10px;">${p.product_name}</td>
                    <td>${p.price} ฿</td>
                    <td>${p.stock}</td>
                    <td>${p.categories?.category_name || '-'}</td>
                    <td><button onclick="deleteProduct(${p.product_id})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">ลบ</button></td>
                </tr>
            `).join('')}
        </table>
    `;

    document.getElementById('prod-form').onsubmit = async (e) => {
        e.preventDefault();
        await supabase.from('products').insert([{
            product_name: document.getElementById('p-name').value,
            price: parseFloat(document.getElementById('p-price').value),
            stock: parseInt(document.getElementById('p-stock').value),
            category_id: document.getElementById('p-cat').value
        }]);
        loadProducts();
    };
}

window.deleteProduct = async function(id) {
    if(confirm('ต้องการลบสินค้านี้ใช่หรือไม่?')) {
        await supabase.from('products').delete().eq('product_id', id);
        loadProducts();
    }
}

// 3. จัดการหมวดหมู่ (Categories)
async function loadCategories() {
    const { data: cats } = await supabase.from('categories').select('*');
    document.getElementById('content').innerHTML = `
        <h2>จัดการหมวดหมู่สินค้า</h2>
        <form id="cat-form" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 10px;">
            <input type="text" id="c-name" placeholder="ชื่อหมวดหมู่" required style="padding: 8px; flex: 3;">
            <button type="submit" style="background: #3b82f6; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">เพิ่มหมวดหมู่</button>
        </form>
        <table border="1" style="width: 100%; background: white; border-collapse: collapse; text-align: left;">
            <tr style="background: #f1f5f9;"><th style="padding: 10px;">ชื่อหมวดหมู่</th><th>จัดการ</th></tr>
            ${cats.map(c => `
                <tr>
                    <td style="padding: 10px;">${c.category_name}</td>
                    <td><button onclick="deleteCategory(${c.category_id})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">ลบ</button></td>
                </tr>
            `).join('')}
        </table>
    `;
    document.getElementById('cat-form').onsubmit = async (e) => {
        e.preventDefault();
        await supabase.from('categories').insert([{ category_name: document.getElementById('c-name').value }]);
        loadCategories();
    };
}

window.deleteCategory = async function(id) {
    await supabase.from('categories').delete().eq('category_id', id);
    loadCategories();
}

// 4. จัดการลูกค้า (Customers)
async function loadCustomers() {
    const { data: custs } = await supabase.from('customers').select('*');
    document.getElementById('content').innerHTML = `
        <h2>จัดการข้อมูลลูกค้า</h2>
        <form id="cust-form" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 10px;">
            <input type="text" id="cu-name" placeholder="ชื่อลูกค้า" required style="padding: 8px; flex: 2;">
            <input type="text" id="cu-phone" placeholder="เบอร์โทรศัพท์" required style="padding: 8px; flex: 2;">
            <button type="submit" style="background: #3b82f6; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">เพิ่มลูกค้า</button>
        </form>
        <table border="1" style="width: 100%; background: white; border-collapse: collapse; text-align: left;">
            <tr style="background: #f1f5f9;"><th style="padding: 10px;">ชื่อลูกค้า</th><th>เบอร์โทร</th><th>จัดการ</th></tr>
            ${custs.map(cu => `
                <tr>
                    <td style="padding: 10px;">${cu.customer_name}</td>
                    <td>${cu.phone}</td>
                    <td><button onclick="deleteCustomer(${cu.customer_id})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">ลบ</button></td>
                </tr>
            `).join('')}
        </table>
    `;
    document.getElementById('cust-form').onsubmit = async (e) => {
        e.preventDefault();
        await supabase.from('customers').insert([{ customer_name: document.getElementById('cu-name').value, phone: document.getElementById('cu-phone').value }]);
        loadCustomers();
    };
}

window.deleteCustomer = async function(id) {
    await supabase.from('customers').delete().eq('customer_id', id);
    loadCustomers();
}

// 5. ขายสินค้า (POS)
async function loadSalesProducts() {
    const { data: products } = await supabase.from('products').select('*');
    document.getElementById('content').innerHTML = `
        <h2>ขายสินค้าหน้าร้าน</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            ${products.map(p => `
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h4>${p.product_name}</h4>
                    <p>ราคา: ${p.price} ฿</p>
                    <p>คงเหลือ: ${p.stock}</p>
                    <button onclick="checkout(${p.product_id}, ${p.price}, ${p.stock})" style="background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 10px;">ขายสินค้าชิ้นนี้ (ตัดสต็อก)</button>
                </div>
            `).join('')}
        </div>
    `;
}

window.checkout = async function(productId, price, stock) {
    if(stock <= 0) {
        alert('สินค้าหมดสต็อก!');
        return;
    }
    // บันทึกคำสั่งซื้อลงตาราง orders
    const { data: order, error } = await supabase.from('orders').insert([{ total_price: price }]).select().single();
    if(order) {
        // ตัดสต็อกสินค้าในฐานข้อมูล
        await supabase.from('products').update({ stock: stock - 1 }).eq('product_id', productId);
        alert('ขายสินค้าสำเร็จ!');
        loadSalesProducts();
    }
}

// 6. ประวัติการขาย (Orders History)
async function loadOrders() {
    const { data: orders } = await supabase.from('orders').select('*').order('order_id', { ascending: false });
    document.getElementById('content').innerHTML = `
        <h2>ประวัติการขาย</h2>
        <table border="1" style="width: 100%; background: white; border-collapse: collapse; text-align: left;">
            <tr style="background: #f1f5f9;"><th style="padding: 10px;">รหัสการขาย</th><th>ยอดเงินรวม</th><th>เวลาที่ทำรายการ</th></tr>
            ${orders.map(o => `
                <tr>
                    <td style="padding: 10px;">#${o.order_id}</td>
                    <td>${o.total_price} บาท</td>
                    <td>${new Date(o.order_timestamp).toLocaleString('th-TH')}</td>
                </tr>
            `).join('')}
        </table>
    `;
}