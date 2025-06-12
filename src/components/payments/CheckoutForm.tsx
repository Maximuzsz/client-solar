import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface CheckoutFormProps {
  planId: number;
  returnUrl?: string;
}

export function CheckoutForm({ returnUrl = "/" }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [,] = useLocation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js ainda não carregou
      // Possível mostrar um indicador adicional de carregamento
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + (returnUrl || "/pagamento-sucesso"),
        },
      });

      // Este ponto só será alcançado quando houver um erro, pois o redirecionamento
      // ocorre no sucesso do pagamento
      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message || "Houve um erro ao processar seu pagamento.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Finalizar Pagamento'
          )}
        </Button>
      </div>
    </form>
  );
}