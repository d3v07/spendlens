import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPayload {
  alertName: string;
  recipientEmail: string;
  threshold: number;
  currentAmount: number;
  periodType: 'daily' | 'weekly' | 'monthly';
  status: 'exceeded' | 'warning';
  filterTeam?: string | null;
  filterService?: string | null;
  filterEnvironment?: string | null;
}

export function useBudgetNotifications() {
  const { toast } = useToast();

  const sendNotification = async (payload: NotificationPayload): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('budget-alert-notification', {
        body: payload,
      });

      if (error) {
        console.error('Error sending notification:', error);
        toast({
          title: 'Notification failed',
          description: error.message || 'Failed to send budget alert notification.',
          variant: 'destructive',
        });
        return false;
      }

      console.log('Notification sent:', data);
      toast({
        title: 'Notification sent',
        description: `Budget alert email sent to ${payload.recipientEmail}`,
      });
      return true;
    } catch (err) {
      console.error('Error invoking notification function:', err);
      toast({
        title: 'Notification failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return { sendNotification };
}
