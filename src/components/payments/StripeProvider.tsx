import { ReactNode, useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Skeleton } from "@/components/ui/skeleton";

// Inicializa o Stripe uma vez para todo o aplicativo
let stripePromise: Promise<Stripe | null>;

// Verifica se a chave pública do Stripe está disponível
const stripePublicKey = 'pk_test_your_stripe_public_key'

if (!stripePublicKey) {
  console.error("Chave pública do Stripe não encontrada! Certifique-se de configurar a variável de ambiente VITE_STRIPE_PUBLIC_KEY.");
} else {
  stripePromise = loadStripe(stripePublicKey); 
}

interface StripeProviderProps {
  clientSecret: string | null;
  children: ReactNode;
}

export function StripeProvider({ clientSecret, children }: StripeProviderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula um pequeno delay para garantir que o Stripe carregue corretamente
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!stripePublicKey) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive font-semibold">
          Configuração de pagamento incompleta. Por favor, contate o suporte.
        </p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-1/3 ml-auto" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-1/3 ml-auto" />
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0284c7',
            colorBackground: '#ffffff',
            colorText: '#1e293b',
            colorDanger: '#ef4444',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '4px',
          },
        },
      }}
    >
      {children}
    </Elements>
  );
}