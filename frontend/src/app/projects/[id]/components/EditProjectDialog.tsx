import * as Dialog from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface EditProjectDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSubmit: (formData: {
        name: string;
        description: string;
        imageUrl: string;
    }) => void;
    initialData?: { name: string; description: string; imageUrl: string };
}

export const EditProjectDialog = ({
    isOpen,
    onOpenChange,
    onSubmit,
    initialData = { name: "", description: "", imageUrl: "" },
}: EditProjectDialogProps) => {
    const [formData, setFormData] = useState(initialData);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        onSubmit(formData);
        onOpenChange(false);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="bg-black/50 fixed inset-0" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-50 border-4 border-black rounded-lg p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-[95%] max-w-lg">
                    <Dialog.Title className="text-xl font-bold mb-4">
                        Edit Project Information
                    </Dialog.Title>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Name
                            </label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Project Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Description
                            </label>
                            <Input
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Project Description"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Image URL
                            </label>
                            <Input
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={handleInputChange}
                                placeholder="Image URL"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleSubmit}>
                                Save
                            </Button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
