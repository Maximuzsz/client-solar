import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { getAvailablePlans } from '@/lib/payment';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  Search,
  Star,
  Users,
  Building,
} from 'lucide-react';

import { PlanType } from '@/lib/payment';

// Alias de tipo para compatibilidade com o código existente
type Plan = PlanType;

export default function Plans() {
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'annual'>('monthly');
  const [, setLocation] = useLocation();

  // Busca planos disponíveis
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['/payment/plans'],
    queryFn: getAvailablePlans,
  });
  
  console.log("Planos carregados:", plans, "Erro:", error);

  // Filtra planos pelo intervalo selecionado
  const filteredPlans = plans?.filter((plan: Plan) => 
    plan.interval === selectedInterval || plan.interval === 'both'
  ) || [];

  // Define ícones para diferentes recursos dos planos
  const featureIcons: Record<string, React.ReactNode> = {
    'redes': <Users className="h-4 w-4" />,
    'unidades': <Building className="h-4 w-4" />,
    'geração': <Zap className="h-4 w-4" />,
    'consumo': <Search className="h-4 w-4" />,
    'relatórios': <Star className="h-4 w-4" />,
    'suporte': <Shield className="h-4 w-4" />,
  };

  // Encontra o ícone apropriado para um recurso
  const getFeatureIcon = (feature: string) => {
    const key = Object.keys(featureIcons).find(k => feature.toLowerCase().includes(k));
    return key ? featureIcons[key] : <Check className="h-4 w-4" />;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Planos de Assinatura</h1>
          <p className="text-muted-foreground">
            Escolha o melhor plano para gerenciar seu consumo e geração de energia solar
          </p>
        </div>

        {/* Seletor de Intervalo */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center border rounded-lg overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                selectedInterval === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted/60'
              }`}
              onClick={() => setSelectedInterval('monthly')}
            >
              Mensal
            </button>
            <div className="border-l h-8" />
            <button
              className={`px-4 py-2 text-sm font-medium ${
                selectedInterval === 'annual'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted/60'
              }`}
              onClick={() => setSelectedInterval('annual')}
            >
              Anual
              {selectedInterval === 'annual' ? null : (
                <span className="ml-1 text-xs text-primary">10% OFF</span>
              )}
            </button>
          </div>
        </div>

        {isLoading ? (
          // Estado de carregamento
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-6 bg-muted rounded-md w-1/3" />
                  <div className="h-12 bg-muted rounded-md w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-8 bg-muted rounded-md" />
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-4 bg-muted rounded-md w-5/6" />
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="h-10 bg-muted rounded-md w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          // Sem planos disponíveis
          <Card className="py-12 text-center">
            <CardContent>
              <p className="text-lg font-medium mb-4">
                Nenhum plano disponível no momento.
              </p>
              <p className="text-muted-foreground mb-8">
                Por favor, tente novamente mais tarde ou entre em contato com o suporte.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Recarregar
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Lista de planos
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan: Plan) => (
              <Card 
                key={plan.id} 
                className={`border-2 ${
                  plan.name.toLowerCase().includes('premium') 
                    ? 'border-primary shadow-lg' 
                    : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.name.toLowerCase().includes('premium') && (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary flex items-center">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Recomendado
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">
                      R$ {plan.price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      /{selectedInterval === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  
                  {/* Lista de recursos */}
                  <ul className="space-y-2">
                    {Array.isArray(plan.features) && plan.features.map((feature, index) => {
                      const featureText = typeof feature === 'string' ? feature : (feature as any).name || '';
                      return (
                        <li key={index} className="flex items-start">
                          <div className="mr-2 mt-0.5 rounded-full bg-primary/10 p-1 text-primary">
                            {getFeatureIcon(featureText)}
                          </div>
                          <span>{featureText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => setLocation(`/checkout/${plan.id}`)}
                    variant={plan.name.toLowerCase().includes('premium') ? 'default' : 'outline'}
                  >
                    {plan.name.toLowerCase().includes('free') ? 'Começar Grátis' : 'Assinar Plano'}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Seção de FAQ ou Recursos */}
        <div className="mt-16 space-y-6">
          <h2 className="text-2xl font-bold text-center">Recursos de Todos os Planos</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Gerenciamento de Redes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Crie e gerencie múltiplas redes de energia, conectando unidades consumidoras e geradoras.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Monitoramento em Tempo Real</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Acompanhe em tempo real o consumo e geração de energia de todas as suas unidades.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Suporte Prioritário</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tenha acesso a suporte técnico especializado para resolver rapidamente qualquer problema.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}