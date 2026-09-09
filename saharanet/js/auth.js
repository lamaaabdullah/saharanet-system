// ============================================
// Create a new customer account
// Note: the customer table row is created automatically via a database Trigger
// (see supabase_fix_signup.sql) — here we just send extra data as metadata
// ============================================
async function signUpCustomer(name, email, company, password) {
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name: name, company: company }
        }
    });
    if (error) return { status: 'error', message: translateError(error.message) };

    return { status: 'success', message: 'Account created successfully! Please check your email to activate your account.' };
}

// ============================================
// Log in
// ============================================
async function loginUser(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { status: 'error', message: translateError(error.message) };
    return { status: 'success', message: 'Logged in successfully!' };
}
// Sign up
//=============================================
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        
        if (name.length < 2) {
            showNotification('Error: Full Name must be at least 2 characters long', 'error');
            return;
        }

        if (email.length < 8) {
            showNotification('Error: Email must be at least 8 characters long', 'error');
            return;
        }

        
        if (password.length < 8) {
            showNotification('Error: Password must be at least 8 characters long', 'error');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            showNotification('Error: Password must contain at least one uppercase letter (A-Z)', 'error');
            return;
        }
        if (!/[a-z]/.test(password)) {
            showNotification('Error: Password must contain at least one lowercase letter (a-z)', 'error');
            return;
        }

        
        if (password !== confirmPassword) {
            showNotification('Error: Password and Confirm Password do not match', 'error');
            return;
        }

        
        const accountType = document.getElementById('account-type').value;
        const companyValue = accountType === 'company'
            ? document.getElementById('company-name').value
            : '';

        
        const result = await signUpCustomer(
            name,
            email,
            companyValue,
            password
        );
        

        showNotification(result.message, result.status);

        if (result.status === 'success') {
            setTimeout(() => window.location.href = 'customer-dashboard.html', 1500);
        }
    });
}
// ============================================
// Log out
// ============================================
async function logoutUser() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// ============================================
// Page protection: call this at the start of any page that requires login
// ============================================
async function requireLogin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// Protects admin-only pages. Redirects non-admins back to the customer dashboard.
async function requireAdmin() {
    const user = await requireLogin();
    if (!user) return null;

    const { data: admin } = await supabase.from('admin').select('*').eq('user_id', user.id).eq('is_active', true).single();
    if (!admin) {
        alert('Access denied: this area is for admins only.');
        window.location.href = 'customer-dashboard.html';
        return null;
    }
    return admin;
}

// ============================================
// Forgot password (sends a real email link, Supabase handles everything)
// ============================================
async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
    });
    if (error) return { status: 'error', message: translateError(error.message) };
    return { status: 'success', message: 'A password reset link has been sent to your email.' };
}

// Called on reset-password.html after the user clicks the email link
async function updateMyPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { status: 'error', message: translateError(error.message) };
    return { status: 'success', message: 'Password updated successfully!' };
}

// Map common Supabase error messages to friendlier English text
function translateError(msg) {
    const map = {
        'Invalid login credentials': 'Invalid email or password',
        'User already registered': 'This email is already registered',
        'Password should be at least 6 characters': 'Password must be at least 6 characters',
        'Email not confirmed': 'Please confirm your email first (check your inbox)'
    };
    return map[msg] || msg;
}
