import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const ErrorDialog = ({ error }: { error: string }) => {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
            <Card className="p-8 max-w-md w-full">
                <h1 className="text-2xl font-extrabold mb-4">Error 😕</h1>
                <p className="font-bold text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.history.back()}>Go Back</Button>
            </Card>
        </div>
    );
};
