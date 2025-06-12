import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { createPaymentIntent, getAvailablePlans } from '@/lib/payment';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle
} from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';

// Defina a interface para o tipo Plan
interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  // Adicione outras propriedades conforme necessário
}

export default function Checkout() {
  const { planId } = useParams<{ planId: string }>();
  const [,] = useLocation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Busca os detalhes do plano com tipagem explícita
  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['/api/v1/payment/plans'],
    queryFn: getAvailablePlans,
  });

  // Corrigido: parâmetro 'plan' tipado explicitamente
  const selectedPlan = plans?.find((plan: Plan) => plan.id === Number(planId));

  // Restante do código permanece igual...
  // Cria o intent de pagamento quando o plano é carregado
  useEffect(() => {
    if (selectedPlan && !clientSecret) {
      const initPayment = async () => {
        try {
          // Converte o preço para centavos para o Stripe
          const amountInCents = Math.round(selectedPlan.price * 100);
          
          const { clientSecret } = await createPaymentIntent(
            selectedPlan.id,
            amountInCents
          );
          
          setClientSecret(clientSecret);
        } catch (error) {
          console.error('Erro ao iniciar pagamento:', error);
        }
      };

      initPayment();
    }
  }, [selectedPlan, clientSecret]);

  // Restante do componente...
  // Loading state enquanto busca planos
  if (plansLoading) {
    return (
      <div className="container max-w-4xl py-8">
        {/* ... */}
      </div>
    );
  }

  // Mostra mensagem se o plano não for encontrado
  if (!selectedPlan && !plansLoading) {
    return (
      <div className="container max-w-4xl py-8">
        {/* ... */}
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* ... */}
    </div>
  );
}

// Página de sucesso no pagamento (permanece igual)
export function PaymentSuccess(): ReactElement {
  const [, setLocation] = useLocation();
  
  return (
    <div className="container max-w-lg py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Pagamento realizado com sucesso!</CardTitle>
          <CardDescription>Sua assinatura foi ativada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Obrigado por assinar o SolarShare. Seu plano foi ativado e você já pode 
            aproveitar todos os benefícios.
          </p>
          <p className="text-sm text-muted-foreground">
            Você receberá um email com os detalhes da sua assinatura em breve.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => setLocation('/dashboard')}>
            Ir para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}