declare module '@paypal/checkout-server-sdk' {
  namespace core {
    class PayPalHttpClient {
      constructor(environment: any);
      execute<T>(request: any): Promise<{ result: T }>;
    }
    
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    
    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
  }
  
  namespace orders {
    class OrdersCreateRequest {
      prefer(preference: string): void;
      requestBody(body: any): void;
    }
    
    class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(body: any): void;
    }
    
    class OrdersGetRequest {
      constructor(orderId: string);
    }
  }
}