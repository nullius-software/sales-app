"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash } from "lucide-react";
import { Organization } from "@/store/organizationStore";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface Props {
    organization: Organization;
    isCurrent: boolean;
    onSelect: (id: number) => void;
    onDelete: () => void;
}

export function NavigationOrganizationItem({
    organization,
    isCurrent,
    onSelect,
    onDelete,
}: Props) {
    const [showActions, setShowActions] = useState(false);
    const { user } = useUserStore()
    const isMobile = useMediaQuery('(max-width: 768px)');

    return (
        <div
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className="flex items-center justify-between group"
        >
            <DropdownMenuItem
                onClick={() => onSelect(organization.id)}
                className={`w-full truncate ${isCurrent
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100"
                    }`}
            >
                {organization.name}
            </DropdownMenuItem>
            {(isMobile || (showActions && user && user.id === organization.creator)) && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="p-1 ml-1 text-muted-foreground hover:text-red-600"
                    onClick={() => {
                        onDelete();
                    }}
                >
                    <Trash className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
