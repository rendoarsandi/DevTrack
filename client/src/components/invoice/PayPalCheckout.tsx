import { useState } from 'react';
import { 
  PayPalScriptProvider, 
  PayPalButtons,
  usePayPalScriptReducer
} from '@paypal/react-paypal-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Tipe props untuk komponen
interface PayPalCheckoutProps {
  invoiceId: number;
  amount: number;
  currency?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
}

// Komponen buttons dengan loading state
const ButtonWrapper = ({ 
  invoiceId, 
  amount, 
  currency = 'USD',
  onSuccess,
  onError 
}: PayPalCheckoutProps) => {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // Buat PayPal order dari backend
  const createOrder = async () => {
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
        }),
      });
      
      const orderData = await response.json();
      
      if (!response.ok) {
        throw new Error(orderData.message || 'Gagal membuat order PayPal');
      }
      
      setOrderId(orderData.orderId);
      return orderData.orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat order PayPal. Silakan coba lagi.',
        variant: 'destructive',
      });
      if (onError) onError(error);
      throw error;
    }
  };
  
  // Tangkap pembayaran setelah approve
  const onApprove = async (data: any) => {
    try {
      const response = await fetch('/api/paypal/capture-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID,
          invoiceId,
        }),
      });
      
      const captureData = await response.json();
      
      if (!response.ok || !captureData.success) {
        throw new Error(captureData.message || 'Gagal menangkap pembayaran PayPal');
      }
      
      toast({
        title: 'Pembayaran Berhasil',
        description: 'Pembayaran invoice telah berhasil diproses.',
        variant: 'default',
      });
      
      if (onSuccess) onSuccess(captureData);
      return captureData;
    } catch (error) {
      console.error('Error capturing payment:', error);
      toast({
        title: 'Error',
        description: 'Gagal memproses pembayaran. Silakan coba lagi.',
        variant: 'destructive',
      });
      if (onError) onError(error);
      throw error;
    }
  };
  
  // Handle error jika ada
  const handleError = (err: any) => {
    console.error('PayPal checkout error:', err);
    toast({
      title: 'Error PayPal',
      description: 'Terjadi kesalahan saat memproses pembayaran PayPal.',
      variant: 'destructive',
    });
    if (onError) onError(err);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center w-full py-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading PayPal...</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 mb-2">Gagal memuat PayPal</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }
  
  return (
    <PayPalButtons
      style={{ 
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'pay'
      }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={handleError}
    />
  );
};

// Komponen PayPal utama
export default function PayPalCheckout(props: PayPalCheckoutProps) {
  // Konversi Rupiah ke USD (menggunakan rate yang sama dengan server)
  const exchangeRate = 15000;
  const amountInUSD = parseFloat((props.amount / exchangeRate).toFixed(2));
  
  return (
    <div className="w-full">
      <PayPalScriptProvider 
        options={{
          clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb',
          currency: props.currency || 'USD',
          intent: 'capture'
        }}
      >
        <ButtonWrapper
          {...props}
          amount={amountInUSD}
        />
      </PayPalScriptProvider>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>
          Nilai pembayaran: ${amountInUSD.toFixed(2)} {props.currency || 'USD'} 
          (Rp {props.amount.toLocaleString('id-ID')})
        </p>
        <p className="mt-1">
          * Pembayaran diproses secara aman melalui PayPal
        </p>
      </div>
    </div>
  );
}