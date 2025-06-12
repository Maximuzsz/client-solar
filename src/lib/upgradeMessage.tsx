import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

/**
 * Função utilitária para exibir mensagem de upgrade com botão
 * para redirecionar o usuário para a página de planos
 */
export const showUpgradeMessage = (message: string) => {
  return toast({
    title: 'Limite de exportações atingido',
    description: (
      <div>
        <p>{message || 'Você atingiu o limite de exportações do seu plano.'}</p>
        <Button 
          className="mt-2 w-full"
          variant="secondary"
          onClick={() => {
            // Redireciona para a página de planos
            window.location.href = '/planos';
          }}
        >
          Fazer upgrade de plano
        </Button>
      </div>
    ),
    variant: 'destructive',
    duration: 10000 // Dar tempo para o usuário clicar no botão
  });
};

/**
 * Função utilitária para exibir mensagem de aviso quando o usuário 
 * está próximo de atingir o limite de exportações
 */
export const showNearLimitWarning = (usedCount: number, maxCount: number) => {
  const remaining = maxCount - usedCount;
  const percentUsed = (usedCount / maxCount) * 100;
  
  // Só mostrar aviso quando acima de 80% do limite
  if (percentUsed >= 80) {
    return toast({
      title: 'Atenção: Limite de exportações',
      description: (
        <div>
          <p>{`Você já utilizou ${usedCount} de ${maxCount} exportações disponíveis no seu plano (${remaining} restantes).`}</p>
          <Button 
            className="mt-2 w-full"
            variant="outline"
            onClick={() => {
              // Redireciona para a página de planos
              window.location.href = '/planos';
            }}
          >
            Ver opções de upgrade
          </Button>
        </div>
      ),
      variant: 'default',
      duration: 8000
    });
  }
  
  return null; // Não mostra nada se estiver abaixo de 80%
};