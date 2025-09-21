import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center p-4">
          <h1 className="text-4xl font-bold text-destructive mb-4">
            حدث خطأ ما
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            نأسف، لقد واجه التطبيق خطأ غير متوقع.
          </p>
          <Button onClick={this.handleRefresh}>
            تحديث الصفحة
          </Button>
          {this.state.error && (
            <details className="mt-6 text-left bg-muted p-4 rounded-lg w-full max-w-2xl">
              <summary className="cursor-pointer text-muted-foreground">التفاصيل الفنية</summary>
              <pre className="mt-2 text-sm whitespace-pre-wrap break-words">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
