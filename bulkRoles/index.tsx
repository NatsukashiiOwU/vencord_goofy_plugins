/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { CodeBlock } from "@components/CodeBlock";
import ErrorBoundary from "@components/ErrorBoundary";
import { Margins } from "@utils/index";
import { closeModal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Button, ChannelStore, Forms, GuildStore, Menu, React, RestAPI, Select, Toasts, UserStore } from "@webpack/common";

interface Role {
    id: string;
    name: string;
}

interface RoleSelectProps {
    roles: Role[];
    onChange: (role: Role | null) => void;
    placeholder?: string;
}

function RoleSelectComponent({ roles, onChange, placeholder = "Choose a role" }: RoleSelectProps) {
    const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleChange = (newValue: string) => {
        const selectedRole = roles.find(r => r.id === newValue) || null;
        if (!selectedRole) {
            setError("Invalid role selected.");
        } else {
            setError(null);
            setSelectedRoleId(newValue);
            onChange(selectedRole);
        }
    };

    return (
        <Forms.FormSection>
            <Select
                options={roles.map(role => ({
                    label: role.name,
                    value: role.id
                }))}
                placeholder={placeholder}
                maxVisibleItems={5}
                closeOnSelect={true}
                select={handleChange}
                isSelected={(value: string) => value === selectedRoleId}
                serialize={(value: any) => String(value)}
            />
            {error && <Forms.FormText style={{ color: "var(--text-danger)" }}>{error}</Forms.FormText>}
        </Forms.FormSection>
    );
}

async function openRoleModal(message: any) {
    let selectedRole: Role | null = null;
    const channel = ChannelStore.getChannel(message.channel_id);
    const guildId = channel?.guild_id;
    const mentionedUsers = message.mentions
        ? Array.isArray(message.mentions)
            ? message.mentions
                .map((u: any) => (typeof u === "string" ? u : u?.id))
                .filter((id: any) => typeof id === "string" && /^[0-9]+$/.test(id))
            : []
        : [];

    if (!guildId) {
        Toasts.show({
            id: `bulkroles-no-guild-${Date.now()}`,
            message: "This message is not in a guild!",
            type: Toasts.Type.FAILURE
        });
        return;
    }

    if (!mentionedUsers.length) {
        Toasts.show({
            id: `bulkroles-no-users-${Date.now()}`,
            message: "No valid users mentioned in this message!",
            type: Toasts.Type.FAILURE
        });
        return;
    }

    const guild = GuildStore.getGuild(guildId);
    if (!guild) {
        Toasts.show({
            id: `bulkroles-no-guild-found-${Date.now()}`,
            message: "Could not find guild data!",
            type: Toasts.Type.FAILURE
        });
        return;
    }

    const roles: Role[] = GuildStore.getRoles(guildId)
        ? Object.values(GuildStore.getRoles(guildId))
            .filter(role => role.name !== "@everyone")
            .map(role => ({
                id: role.id,
                name: role.name
            }))
        : [];

    if (!roles.length) {
        Toasts.show({
            id: `bulkroles-no-roles-${Date.now()}`,
            message: "No roles available in this guild!",
            type: Toasts.Type.FAILURE
        });
        return;
    }

    const key = openModal(props => (
        <ErrorBoundary>
            <ModalRoot {...props} size={ModalSize.LARGE}>
                <ModalHeader>
                    <Forms.FormTitle tag="h4">Add Bulk Role</Forms.FormTitle>
                    <ModalCloseButton onClick={() => closeModal(key)} />
                </ModalHeader>
                <ModalContent>
                    <div style={{ padding: "16px 0" }}>
                        <Forms.FormTitle tag="h5">Message Content</Forms.FormTitle>
                        <CodeBlock content={message.content} lang="" />
                        <Forms.FormDivider className={Margins.bottom20} />
                        <Forms.FormTitle tag="h5">Mentioned Users</Forms.FormTitle>
                        <CodeBlock
                            content={JSON.stringify(
                                mentionedUsers.map((id: string) => UserStore.getUser(id)?.username || id),
                                null,
                                4
                            )}
                            lang="json"
                        />
                        <Forms.FormDivider className={Margins.bottom20} />
                        <Forms.FormTitle tag="h5">Select Role</Forms.FormTitle>
                        <RoleSelectComponent
                            roles={roles}
                            onChange={(role: Role | null) => {
                                selectedRole = role;
                            }}
                        />
                    </div>
                </ModalContent>
                <ModalFooter>
                    <Button
                        color={Button.Colors.BRAND}
                        onClick={async () => {
                            if (!selectedRole) {
                                Toasts.show({
                                    id: `bulkroles-no-role-selected-${Date.now()}`,
                                    message: "Please select a role!",
                                    type: Toasts.Type.FAILURE
                                });
                                return;
                            }

                            try {
                                for (const userId of mentionedUsers) {
                                    await RestAPI.put({
                                        url: `/guilds/${guildId}/members/${userId}/roles/${selectedRole.id}`
                                    });
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                }
                                Toasts.show({
                                    id: `bulkroles-success-${Date.now()}`,
                                    message: `Assigned role ${selectedRole.name} to ${mentionedUsers.length} user(s)!`,
                                    type: Toasts.Type.SUCCESS
                                });
                                closeModal(key);
                            } catch {
                                Toasts.show({
                                    id: `bulkroles-error-${Date.now()}`,
                                    message: "Failed to assign roles! Check permissions or user validity.",
                                    type: Toasts.Type.FAILURE
                                });
                            }
                        }}
                    >
                        Apply Role
                    </Button>
                    <Button
                        color={Button.Colors.TRANSPARENT}
                        look={Button.Looks.LINK}
                        onClick={() => closeModal(key)}
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalRoot>
        </ErrorBoundary>
    ));
}

const messageCtxPatch: NavContextMenuPatchCallback = (children, { message }) => {
    if (!message.content) return;

    const channel = ChannelStore.getChannel(message.channel_id);
    if (!channel?.guild_id) return;

    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    group.splice(group.findIndex(c => c?.props?.id === "copy-text") + 1, 0, (
        <Menu.MenuItem
            id="vc-bulkroles"
            label="Assign Role to Mentioned Users"
            action={() => openRoleModal(message)}
        />
    ));
};

export default definePlugin({
    name: "BulkRoles",
    description: "Assign a role to all users mentioned in a message",
    authors: [{ name: "kitayama", id: 221907722440802304n }],
    contextMenus: {
        "message": messageCtxPatch
    }
});
