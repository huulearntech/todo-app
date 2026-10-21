"use client";

import { useState } from "react";
import {
  ProjectRole,
} from "@todo/shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteContent,
  AutocompleteList,
  AutocompleteItem,
  AutocompleteEmpty,
} from "@/components/ui/autocomplete";
import { Loader2Icon } from "lucide-react";
import { useShareProjectContext } from "./share-project-context";

export function ShareProjectInviteForm() {
  const {
    suggestions,
    ability,
    members,
    invitations,
    onSendInvite,
    isInviting: isPending,
  } = useShareProjectContext();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>(ProjectRole.EDITOR);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const assignableRoles = ability.assignableRoles;
  const trimmedEmail = email.trim().toLowerCase();
  const alreadyMember = members.some((m) => m.user?.email.toLowerCase() === trimmedEmail);
  const existingPendingInvite = !alreadyMember
    ? invitations.find((inv) => inv.invitedEmail.toLowerCase() === trimmedEmail)
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedEmail || alreadyMember) return;

    setErrorMessage(null);
    try {
      await onSendInvite(trimmedEmail, role);
      setEmail("");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setErrorMessage(msg || "Failed to send invitation. Please check the email.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 shrink-0 w-full min-w-0"
    >
      <div className="flex items-center gap-2 w-full min-w-0">
        <div className="flex-1 min-w-0">
          <Autocomplete
            items={suggestions}
            value={email}
            onValueChange={(val) => {
              if (typeof val === "string") setEmail(val);
            }}
          >
            <AutocompleteInput
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
            <AutocompleteContent className="w-80 p-1">
              <AutocompleteList>
                {suggestions.map((collab) => (
                  <AutocompleteItem
                    key={collab.id}
                    value={collab.email}
                    onClick={() => setEmail(collab.email)}
                    className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer"
                  >
                    <Avatar size="sm">
                      <AvatarImage src={collab.avatarUrl || undefined} />
                      <AvatarFallback>
                        {(collab.name || collab.email)
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-xs font-medium text-foreground">
                        {collab.name}
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground">
                        {collab.email}
                      </span>
                    </div>
                  </AutocompleteItem>
                ))}
              </AutocompleteList>
              <AutocompleteEmpty>
                No known collaborators found
              </AutocompleteEmpty>
            </AutocompleteContent>
          </Autocomplete>
        </div>

        <Select
          value={role}
          onValueChange={(val) => val && setRole(val as ProjectRole)}
          disabled={isPending}
        >
          <SelectTrigger className="w-24 shrink-0 h-9 text-xs cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {assignableRoles.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          size="sm"
          className="h-9 px-3.5 text-xs shrink-0 cursor-pointer"
          disabled={isPending || !email.trim() || alreadyMember}
        >
          {isPending ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            "Invite"
          )}
        </Button>
      </div>

      {alreadyMember && (
        <p className="text-[11px] text-amber-500 font-medium leading-tight">
          This user is already a member of this project.
        </p>
      )}

      {existingPendingInvite && (
        <p className="text-[11px] text-blue-500 font-medium leading-tight">
          Already invited ({existingPendingInvite.role}). Submitting will refresh and resend the invitation link.
        </p>
      )}

      {errorMessage && (
        <p className="text-[11px] text-destructive leading-tight">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
