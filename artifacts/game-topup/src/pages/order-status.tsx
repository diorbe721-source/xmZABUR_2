import { useRoute, Link } from "wouter";
import { useGetOrder } from "@workspace/api-client-react";
import { CheckCircle2, Clock, XCircle, ChevronRight, Zap, RefreshCw, AlertTriangle } from "lucide-react";
import { OrderStatus } from "@workspace/api-client-react";
import { formatSomFromUsd } from "@/lib/currency";

export default function OrderStatusPage() {
  const [, params] = useRoute("/orders/:orderId");
  const orderId = params?.orderId ? parseInt(params.orderId, 10) : 0;

  // Poll every 3 seconds while not completed or failed
  const { data: order, isLoading, error } = useGetOrder(orderId, {
    query: {
      queryKey: [`/api/orders/${orderId}`],
      enabled: !!orderId,
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === OrderStatus.completed || status === OrderStatus.failed) {
          return false; // stop polling
        }
        return 3000;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-16 h-16 text-primary animate-spin mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Loading Order Status</h1>
        <p className="text-muted-foreground">Please wait while we retrieve your order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-20 h-20 text-destructive mb-6" />
        <h1 className="text-3xl font-extrabold text-white mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          We couldn't find an order with this ID. Please check the ID and try tracking again.
        </p>
        <Link href="/track" className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:glow-primary transition-all">
          Track Another Order
        </Link>
      </div>
    );
  }

  const isCompleted = order.status === OrderStatus.completed;
  const isFailed = order.status === OrderStatus.failed;
  const isPending = order.status === OrderStatus.pending;
  const isProcessing = order.status === OrderStatus.processing || order.status === OrderStatus.paid;

  return (
    <div className="flex-1 container mx-auto px-4 py-12 md:py-24 flex flex-col items-center min-h-[60vh]">
      
      <div className="w-full max-w-2xl bg-card border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
        {/* Background glow based on status */}
        <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20 ${
          isCompleted ? 'bg-primary' : isFailed ? 'bg-destructive' : 'bg-secondary'
        }`} />

        <div className="flex flex-col items-center text-center mb-12 relative z-10">
          {isCompleted ? (
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-primary/30">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
          ) : isFailed ? (
            <div className="w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-destructive/30">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-secondary/30 relative">
              <Clock className="w-12 h-12 text-secondary relative z-10" />
              <div className="absolute inset-0 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            {isCompleted ? "Top-up Successful!" : 
             isFailed ? "Top-up Failed" : 
             isProcessing ? "Processing Order..." : "Waiting for Payment"}
          </h1>
          
          <p className="text-muted-foreground text-lg">
            {isCompleted ? "Your in-game currency has been delivered. You can safely close this page." : 
             isFailed ? "There was an issue processing your order. Please contact support." : 
             isProcessing ? "We have received your payment and are delivering your currency. This usually takes less than 5 seconds." : 
             "Please complete your payment to receive your top-up."}
          </p>

          {isPending && order.checkoutUrl && (
            <a 
              href={order.checkoutUrl}
              className="mt-8 px-8 py-4 bg-primary text-primary-foreground font-black text-lg uppercase tracking-wider rounded-xl hover:glow-primary hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Complete Payment
            </a>
          )}
        </div>

        <div className="bg-background/50 border border-white/5 rounded-2xl p-6 relative z-10">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Order Details</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono font-bold text-white">#{order.id}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-muted-foreground">Game</span>
              <span className="font-bold text-white">{order.gameName || `Game #${order.gameId}`}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-muted-foreground">Player ID</span>
              <span className="font-mono font-bold text-white">{order.playerId}</span>
            </div>
            
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-muted-foreground">Package</span>
              <span className="font-bold text-white">{order.packageName || `Package #${order.packageId}`}</span>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="text-xl font-mono font-bold text-primary">
                 {formatSomFromUsd(order.packagePrice)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Link href="/games" className="text-muted-foreground hover:text-white flex items-center gap-1 font-medium transition-colors">
            Return to Games <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
