import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { StripeProvider } from '@/components/payments/StripeProvider';
import { CheckoutForm } from '@/components/payments/CheckoutForm';
import { createPaymentIntent, getAvailablePlans } from '@/lib/payment';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  LucideShieldCheck,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";

export default function Checkout() {
  const { planId } = useParams<{ planId: string }>();
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Busca os detalhes do plano
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/v1/payment/plans'],
    queryFn: getAvailablePlans,
  });

  const selectedPlan = plans?.find(plan => plan.id === Number(planId));

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

  // Loading state enquanto busca planos
  if (plansLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setLocation('/planos')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para planos
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-8">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-1/3 ml-auto" />
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Mostra mensagem se o plano não for encontrado
  if (!selectedPlan && !plansLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setLocation('/planos')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para planos
        </Button>
        
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-lg mb-4">Plano não encontrado ou indisponível.</p>
            <Button onClick={() => setLocation('/planos')}>
              Ver planos disponíveis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => setLocation('/planos')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para planos
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resumo do plano */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Plano</CardTitle>
              <CardDescription>Detalhes da sua assinatura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedPlan?.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPlan?.description}</p>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium">Preço</span>
                <span className="font-semibold">R$ {selectedPlan?.price.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-medium">Faturamento</span>
                <span className="text-sm">
                  {selectedPlan?.interval === 'monthly' ? 'Mensal' : 'Anual'}
                </span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 px-6 py-4 flex flex-col space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <LucideShieldCheck className="mr-2 h-4 w-4" />
                <span>Pagamento seguro via Stripe</span>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Aceita todos os principais cartões</span>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Formulário de pagamento */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Pagamento</CardTitle>
              <CardDescription>Preencha os dados do seu cartão para finalizar a compra</CardDescription>
            </CardHeader>
            <CardContent>
              <StripeProvider clientSecret={clientSecret}>
                <CheckoutForm 
                  planId={Number(planId)} 
                  returnUrl="/pagamento-sucesso"
                />
              </StripeProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Página de sucesso no pagamento
export function PaymentSuccess() {
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