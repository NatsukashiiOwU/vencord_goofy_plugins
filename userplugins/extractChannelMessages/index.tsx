/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { CodeBlock } from "@components/CodeBlock";
import ErrorBoundary from "@components/ErrorBoundary";
import { KeyboardEvent } from "react";
import {
    closeModal,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalRoot,
    ModalSize,
    openModal,
} from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import {
    Button,
    Forms,
    Menu,
    MessageStore,
    React,
    Select,
    TextArea,
    TextInput,
    Toasts,
} from "@webpack/common";

interface ParsedMessage {
    messageId: string;
    teamname: string | null;
    players: string[];
}

function formatRawMessages(messages: any[]) {
    return messages.map((msg) => ({
        id: msg.id,
        author: msg.author?.username || "Unknown",
        content: msg.content || "",
        timestamp: msg.timestamp?.toISOString() || "Unknown",
        mentions: [],
    }));
}

function parseTeamMessages(messages: any[]): ParsedMessage[] {
    const mentionRegex = /<@!?(\d+)>/g;

    return messages
        .map((msg) => {
            const content = msg.content || "";
            const matches = [...content.matchAll(mentionRegex)];
            const userIds = matches.map((match) => match[1]); // Extract user IDs
            let teamname: string | null = null;

            if (content.trim()) {
                const firstMention = matches[0]?.[0]; // e.g., <@34762378>
                if (firstMention) {
                    const mentionIndex = content.indexOf(firstMention);
                    if (mentionIndex > 0) {
                        teamname = content.slice(0, mentionIndex).trim();
                    }
                } else {
                    teamname = content.trim();
                }
            }

            return {
                messageId: msg.id,
                teamname,
                players: userIds,
            };
        })
        .filter((msg) => msg.teamname || msg.players.length); // Skip empty messages
}

function formatTeamMessagesText(
    messages: ParsedMessage[],
    previewMode: "teams" | "matcher",
): string {
    return messages
        .map((msg, index) => {
            const team = msg.teamname || "";
            const players = msg.players.map((id) => `<@${id}>`).join(" ");
            return previewMode === "matcher"
                ? `${index + 1}. ${team}${team && players ? " - " : players ? "- " : ""}${players}`
                : `${team}${team && players ? " - " : players ? "- " : ""}${players}`;
        })
        .join("\n");
}

function composeLobby(
    teamsList: string,
    teamMessages: ParsedMessage[],
): ParsedMessage[] {
    // Split the teamsList into an array of trimmed team names, filtering out empty lines
    const teamsArray = teamsList
        .split("\n")
        .map((team) => team.trim())
        .filter((team) => team);
    // Create a map to group players by team name
    const teamMap: { [key: string]: string[] } = {};

    // Initialize the map with empty player arrays for each team in teamsArray
    teamsArray.forEach((team) => {
        teamMap[team.toLowerCase()] = [];
    });

    // Iterate through teamMessages to group players by team name
    teamMessages.forEach((msg) => {
        if (msg.teamname) {
            const teamKey = msg.teamname.toLowerCase();
            // Check if the team name is in the provided teamsList
            if (teamMap.hasOwnProperty(teamKey)) {
                // Add players to the corresponding team, avoiding duplicates
                msg.players.forEach((player) => {
                    if (!teamMap[teamKey].includes(player)) {
                        teamMap[teamKey].push(player);
                    }
                });
            }
        }
    });

    // Convert the teamMap to an array of ParsedMessage objects
    const lobby: ParsedMessage[] = teamsArray.map((team, index) => {
        const players = teamMap[team.toLowerCase()] || [];
        return {
            messageId: `lobby-${index}-${Date.now()}`, // Generate a unique ID
            teamname: team,
            players,
        };
    });
    return lobby;
}

function downloadMessages(data: any, channelId: string, mode: string) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `messages_${channelId}_${mode}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function MessagesModal({
    channel,
    messages,
}: {
    channel: any;
    messages: any[];
}) {
    const [previewMode, setPreviewMode] = React.useState<
        "raw" | "teams" | "matcher"
    >("raw");
    const [teamsList, setTeamsList] = React.useState<string>("");

    const rawMessages = React.useMemo(
        () => formatRawMessages(messages),
        [messages],
    );
    const teamMessages = React.useMemo(
        () => parseTeamMessages(messages),
        [messages],
    );
    const lobby = React.useMemo(
        () => composeLobby(teamsList, teamMessages),
        [teamsList, teamMessages],
    );

    const content = React.useMemo(() => {
        switch (previewMode) {
            case "raw":
                return JSON.stringify(rawMessages, null, 2);
            case "teams":
                return formatTeamMessagesText(teamMessages, previewMode);
            case "matcher":
                return formatTeamMessagesText(lobby, previewMode);
            default:
                return "";
        }
    }, [previewMode, rawMessages, teamMessages, lobby]);

    const modes = [
        { label: "Raw JSON", value: "raw" },
        ...(settings.store.enabled13yog
            ? [
                  { label: "Parsed Teams", value: "teams" },
                  { label: "Lobby matcher", value: "matcher" },
              ]
            : []),
    ];

    const lang = previewMode === "raw" ? "json" : "";

    return (
        <div>
            <Forms.FormSection>
                <Forms.FormTitle tag="h5">Preview Mode</Forms.FormTitle>
                <Select
                    options={modes}
                    placeholder="Select preview mode"
                    maxVisibleItems={2}
                    closeOnSelect={true}
                    select={(value: string) =>
                        setPreviewMode(value as "raw" | "teams" | "matcher")
                    }
                    isSelected={(value: string) => value === previewMode}
                    serialize={(value: any) => String(value)}
                />
            </Forms.FormSection>
            <Forms.FormSection>
                <Forms.FormTitle tag="h5">
                    Messages ({teamMessages.length})
                </Forms.FormTitle>
                {previewMode === "matcher" && (
                    <TextArea
                        style={{ marginBottom: "10px" }}
                        placeholder={"input team list"}
                        value={teamsList}
                        onChange={setTeamsList}
                    />
                )}
                <CodeBlock content={content} lang={lang} />
                <Forms.FormText>
                    Click the copy button to copy the{" "}
                    {previewMode === "raw"
                        ? "raw messages as JSON"
                        : "parsed teams as text"}
                    .
                </Forms.FormText>
            </Forms.FormSection>
        </div>
    );
}

function openMessagesModal(channel: any) {
    const channelId = channel?.id;
    if (!channelId) {
        Toasts.show({
            id: `extract-messages-no-channel-${Date.now()}`,
            message: "Invalid channel!",
            type: Toasts.Type.FAILURE,
        });
        return;
    }

    const messages = MessageStore.getMessages(channelId)?.toArray() || [];
    if (!messages.length) {
        Toasts.show({
            id: `extract-messages-no-messages-${Date.now()}`,
            message: "No messages found in cache for this channel!",
            type: Toasts.Type.FAILURE,
        });
        return;
    }

    const key = openModal((props) => (
        <ErrorBoundary>
            <ModalRoot {...props} size={ModalSize.LARGE}>
                <ModalHeader>
                    <Forms.FormTitle tag="h4">
                        Channel Messages ({channel.name || channelId})
                    </Forms.FormTitle>
                    <ModalCloseButton onClick={() => closeModal(key)} />
                </ModalHeader>
                <ModalContent>
                    <div style={{ padding: "16px 0" }}>
                        <MessagesModal channel={channel} messages={messages} />
                    </div>
                </ModalContent>
                <ModalFooter>
                    <Button
                        color={Button.Colors.BRAND}
                        onClick={() => {
                            const mode =
                                document.querySelector(".vc-select input")
                                    ?.value || "raw";
                            const data =
                                mode === "raw"
                                    ? formatRawMessages(messages)
                                    : parseTeamMessages(messages);
                            downloadMessages(data, channelId, mode);
                        }}
                    >
                        Download JSON
                    </Button>
                    <Button
                        color={Button.Colors.TRANSPARENT}
                        look={Button.Looks.LINK}
                        onClick={() => closeModal(key)}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </ModalRoot>
        </ErrorBoundary>
    ));
}

const channelCtxPatch: NavContextMenuPatchCallback = (children, props) => {
    const { channel } = props;
    if (!channel) return;

    // Skip irrelevant menus (e.g., notification settings)
    if (props.label === "Channel Actions") return;

    // Handle developer-actions group if present
    const lastChild = children.at(-1);
    let targetChildren = children;
    if (lastChild?.key === "developer-actions") {
        const p = lastChild.props;
        if (!Array.isArray(p.children)) {
            p.children = [p.children];
        }
        targetChildren = p.children;
    }

    // Insert the menu item before the last child
    targetChildren.splice(
        -1,
        0,
        <Menu.MenuItem
            id="vc-extract-messages"
            label="Extract Channel Messages"
            action={() => openMessagesModal(channel)}
        />,
    );
};

// Could be extended by adding new custom settings
const settings = definePluginSettings({
    enabled13yog: {
        description: "13yog toolkit",
        type: OptionType.BOOLEAN,
        default: false,
    },
});

export default definePlugin({
    name: "ExtractChannelMessages",
    description:
        "Retrieve all cached messages from a channel and some other funky super niche stuff",
    authors: [{ name: "kitayama", id: 221907722440802304n }],
    settings,
    contextMenus: {
        "channel-context": channelCtxPatch,
    },
});
