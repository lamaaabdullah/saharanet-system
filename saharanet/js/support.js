// ============================================
// Validate Saudi phone number format (05xxxxxxxx - 10 digits)
// ============================================
function isValidSaudiPhone(phone) {
    return /^05\d{8}$/.test(phone.trim());
}

// ============================================
// Validate email format (contains @ and a valid domain)
// ============================================
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ============================================
// Full validation: at least one contact method required, and must be valid if provided
// ============================================
function validateContactInfo(phone, email) {
    const hasPhone = phone && phone.trim() !== '';
    const hasEmail = email && email.trim() !== '';

    if (!hasPhone && !hasEmail) {
        return { valid: false, message: 'Please enter at least a phone number or email so we can contact you' };
    }
    if (hasPhone && !isValidSaudiPhone(phone)) {
        return { valid: false, message: 'Invalid phone number — must start with 05 and be 10 digits' };
    }
    if (hasEmail && !isValidEmail(email)) {
        return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
}

// ============================================
// Submit a real support ticket to the support_logs table
// (currently requires login, per the current RLS policies)
// ============================================
async function submitSupportTicket(title, phone, email, message) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { status: 'error', message: 'Please log in first to contact support' };
    }

    const { data: customer } = await supabase.from('customer').select('customer_id').eq('user_id', user.id).single();
    if (!customer) {
        return { status: 'error', message: 'Could not find your profile' };
    }

    const { error } = await supabase.from('support_logs').insert({
        title: title,
        content: message,
        phone: phone ? phone.trim() : null,
        contact_email: email ? email.trim() : null,
        status: 'open',
        customer_id: customer.customer_id
    });

    if (error) return { status: 'error', message: error.message };
    return { status: 'success', message: 'Your request was sent successfully! Our support team will contact you soon.' };
}
