import crypto from 'crypto';

// Simpan kode verifikasi dalam memori (dalam produksi, idealnya menggunakan database Redis/PostgreSQL)
const verificationCodes: Record<string, { code: string, expires: Date }> = {};

// Fungsi untuk menghasilkan kode verifikasi 6 digit
export async function generateVerificationCode(email: string): Promise<string> {
  // Menghasilkan angka random 6 digit
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Simpan kode dengan waktu kadaluarsa 1 jam dari sekarang
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);
  
  verificationCodes[email] = { code, expires };
  
  return code;
}

// Fungsi untuk memverifikasi kode
export function verifyCode(email: string, code: string): boolean {
  const storedData = verificationCodes[email];
  
  // Jika tidak ada kode tersimpan atau sudah kadaluarsa
  if (!storedData || new Date() > storedData.expires) {
    return false;
  }
  
  // Periksa kodenya cocok atau tidak
  return storedData.code === code;
}

// Simulasi fungsi pengiriman email
// Dalam produksi, ini akan menggunakan layanan email seperti SendGrid
export async function sendVerificationEmail(email: string, username: string): Promise<boolean> {
  try {
    const code = await generateVerificationCode(email);
    
    // Dalam sistem yang sebenarnya, kita akan mengirim email di sini
    // Untuk demo, kita hanya log ke konsol
    console.log(`
===============================================
EMAIL VERIFICATION [FourByte]
===============================================
To: ${email}
Subject: Email Verification Code

Dear ${username},

Please use the following code to verify your email address:

${code}

This code will expire in 1 hour.

Thank you,
FourByte Team
===============================================
    `);
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// Fungsi untuk mengirim ulang kode verifikasi
export async function resendVerificationCode(email: string): Promise<boolean> {
  try {
    const code = await generateVerificationCode(email);
    
    // Di sini akan ada kode untuk mengirim email
    console.log(`
===============================================
EMAIL VERIFICATION [FourByte] - RESEND
===============================================
To: ${email}
Subject: New Email Verification Code

Your new verification code is:

${code}

This code will expire in 1 hour.

Thank you,
FourByte Team
===============================================
    `);
    
    return true;
  } catch (error) {
    console.error('Error resending verification code:', error);
    return false;
  }
}