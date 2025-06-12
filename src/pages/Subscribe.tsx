import { useEffect, useState } from 'react'
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Layout } from '@/components/layout/Layout'
import { apiRequest } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

// Carrega o Stripe fora do componente para evitar re-inicialização
// @ts-ignore - import.meta.env é adicionado pelo Vite em tempo de execução
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY')
}
// @ts-ignore - import.meta.env é adicionado pelo Vite em tempo de execução
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

// Componente do formulário de assinatura
const SubscribeForm = () => {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing`,
        },
      })

      if (error) {
        toast({
          title: 'Erro na assinatura',
          description: error.message || 'Ocorreu um erro ao processar sua assinatura.',
          variant: 'destructive',
        })
      } else {
        // Sucesso será tratado pelo redirect na URL de retorno
        toast({
          title: 'Assinatura confirmada',
          description: 'Sua assinatura foi processada com sucesso.',
        })
      }
    } catch (error) {
      console.error('Erro ao processar assinatura:', error)
      toast({
        title: 'Erro na assinatura',
        description: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      <div className="pt-4">
        <Button
          type="submit"
          className="w-full"
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? 'Processando...' : 'Confirmar assinatura'}
        </Button>
      </div>
    </form>
  )
}

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Cria uma assinatura assim que a página carrega
    const fetchSubscription = async () => {
      try {
        setIsLoading(true)
        const data = await apiRequest('POST', '/api/get-or-create-subscription')
        setClientSecret(data.clientSecret)
      } catch (err) {
        console.error('Erro ao criar assinatura:', err)
        setError('Não foi possível iniciar o processo de assinatura. Por favor, tente novamente.')
        toast({
          title: 'Erro ao iniciar assinatura',
          description: 'Não foi possível conectar ao servidor de pagamento.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [toast])

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  if (error || !clientSecret) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Erro na Assinatura</CardTitle>
              <CardDescription>
                Não foi possível iniciar o processo de assinatura
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const, // Fix: Use 'as const' to narrow the type
      labels: 'floating' as const,
    },
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Assinar Plano Premium</h1>
          <p className="text-muted-foreground mt-2">
            Obtenha acesso completo a todas as funcionalidades do SolarShare
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Plano Premium</CardTitle>
                <CardDescription>Acesso a todas as funcionalidades</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">R$199,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Criação ilimitada de redes de energia</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Até 100 unidades consumidoras/geradoras</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Relatórios avançados de consumo e economia</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Alertas e notificações personalizadas</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Análises preditivas de geração</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Acesso antecipado a novos recursos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes de Pagamento</CardTitle>
                <CardDescription>
                  Sua assinatura será renovada automaticamente. Você pode cancelar a qualquer momento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={options}>
                  <SubscribeForm />
                </Elements>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                  <p>
                    Ao finalizar sua assinatura, você concorda com nossos{' '}
                    <a href="#" className="text-primary underline">
                      Termos de Serviço
                    </a>{' '}
                    e{' '}
                    <a href="#" className="text-primary underline">
                      Política de Privacidade
                    </a>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}