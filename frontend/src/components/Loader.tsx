import { Card } from "./ui/card";

export const Loader = () => {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
            <Card className="p-8 max-w-md w-full">
                <h1 className="text-2xl font-extrabold mb-4">
                    Loading project...
                </h1>
                <div className="w-full h-8 bg-white border-4 border-black relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-blue-400 animate-pulse w-1/2"></div>
                </div>
            </Card>
        </div>
    );
};
