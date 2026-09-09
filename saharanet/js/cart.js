function openPopup(id) { document.getElementById(id)?.style.setProperty('display', 'flex'); }
function closePopup(id) { document.getElementById(id)?.style.setProperty('display', 'none'); }
function switchPopup(currentId, nextId) {
    closePopup(currentId);
    setTimeout(() => openPopup(nextId), 100);
}
function openCartModal() { openPopup('cart-modal'); }
function closeCartModal() { closePopup('cart-modal'); }

function toggleMobileNav() {
    document.getElementById('main-nav-list')?.classList.toggle('nav-open');
}

// Close any open popup by clicking outside its box, or pressing Escape
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('custom-popup-overlay')) {
        e.target.style.display = 'none';
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.custom-popup-overlay').forEach(p => p.style.display = 'none');
    }
});

function showNotification(message, type) {
    const n = document.getElementById('notification');
    if (!n) return;
    document.getElementById('notification-text').innerText = message;
    n.className = 'notification-toast ' + type;
    n.style.display = 'flex';
    setTimeout(() => n.style.display = 'none', 4000);
}

let cart = JSON.parse(localStorage.getItem('sahara_cart')) || [];
window.addEventListener('DOMContentLoaded', updateCartUI);

function addToCart(name, price) {
    cart.push({ name, price });
    localStorage.setItem('sahara_cart', JSON.stringify(cart));
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('sahara_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const countElem = document.getElementById('top-cart-count');
    if (countElem) countElem.innerText = cart.length;

    const btn = document.getElementById('top-view-cart');
    if (btn) btn.classList.toggle('has-items', cart.length > 0);

    const list = document.getElementById('cart-items-list');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#777;">Your cart is empty.</p>';
        document.getElementById('cart-total-price').innerText = '0 SAR';
        return;
    }

    let total = 0;
    list.innerHTML = cart.map((item, i) => {
        total += item.price;
        return `<div class="cart-item-row"><span>${item.name}</span>
                <div><span style="font-weight:bold;margin-right:10px;">${item.price} SAR</span>
                <button class="remove-item-btn" onclick="removeFromCart(${i})">&times;</button></div></div>`;
    }).join('');
    document.getElementById('cart-total-price').innerText = total + ' SAR';
}

// ============================================
// Checkout: creates a real booking for each cart item under the logged-in customer
// ============================================
async function checkoutAlert() {
    if (cart.length === 0) { alert('Your cart is empty!'); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Please log in first to complete your purchase');
        window.location.href = 'login.html';
        return;
    }

    const { data: customerRow, error: customerError } = await supabase.from('customer').select('customer_id').eq('user_id', user.id).single();
    if (!customerRow) {
        alert('Could not find your profile: ' + (customerError?.message ?? ''));
        return;
    }

    let successCount = 0;
    let failMessages = [];

    for (const item of cart) {
        const { data: plan, error: planError } = await supabase.from('hosting_plan').select('plan_id').eq('name', item.name).single();
        if (!plan) { failMessages.push(`${item.name}: Plan not found (${planError?.message ?? ''})`); continue; }

        let { data: service } = await supabase.from('service').select('service_id').eq('plan_id', plan.plan_id).single();
        if (!service) {
            // ✅ We don't set a fake admin_id, leave it null (admin_id column must allow NULL — see patch)
            const { data: newService, error: serviceError } = await supabase.from('service').insert({
                name: item.name, service_duration: '1 month', price: item.price, admin_id: null, plan_id: plan.plan_id
            }).select().single();

            if (serviceError) { failMessages.push(`${item.name}: ${serviceError.message}`); continue; }
            service = newService;
        }
        if (!service) { failMessages.push(`${item.name}: Could not create service`); continue; }

        const { data: newBooking, error: bookingError } = await supabase.from('booking').insert({
            start_date: new Date().toISOString().split('T')[0],
            status: item.price === 0 ? 'active' : 'pending',
            customer_id: customerRow.customer_id,
            service_id: service.service_id
        }).select().single();

        if (bookingError) { failMessages.push(`${item.name}: ${bookingError.message}`); continue; }

        if (newBooking) {
            await supabase.from('billing').insert({
                amount: item.price,
                invoice_date: new Date().toISOString().split('T')[0],
                payment_status: item.price === 0 ? 'paid' : 'unpaid',
                customer_id: customerRow.customer_id,
                booking_id: newBooking.booking_id
            });
            successCount++;
        }
    }

    if (successCount > 0) {
        alert(`Successfully registered ${successCount} of your orders!` + (failMessages.length ? `\n\nFailed: ${failMessages.join(', ')}` : ''));
    } else {
        alert('Could not register any order:\n' + failMessages.join('\n'));
    }

    cart = [];
    localStorage.removeItem('sahara_cart');
    updateCartUI();
    closeCartModal();

    if (typeof refreshServicesCount === 'function') {
        refreshServicesCount();
    }
}
