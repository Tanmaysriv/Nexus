"use client";
import {
  ArrowUp,
  Bot,
  Clock3,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
  User,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type Conversation = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

type HistoryResponse = {
  conversations: Conversation[];
};

type ConversationResponse = {
  conversation: Conversation;
  messages: Message[];
};

type CopilotResponse = {
  answer: string;
  conversationId?: string;
};

const suggestions = [
  "What should I focus on first to become a stronger Software Engineer candidate?",
  "Analyze my biggest career weaknesses.",
  "Which projects should I improve for my portfolio?",
  "Create a plan to improve my DSA and interview skills.",
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] =
    useState(true);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  async function loadHistory() {
    try {
      const response = await fetch(
        "/api/copilot/history",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load Copilot history."
        );
      }

      const data: HistoryResponse =
        await response.json();

      setConversations(
        data.conversations ?? []
      );
    } catch (error) {
      console.error(
        "Copilot history error:",
        error
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
  // This effect intentionally loads persisted server state on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadHistory();
}, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function loadConversation(id: string) {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/copilot/${id}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load conversation."
        );
      }

      const data: ConversationResponse =
        await response.json();

      setConversationId(id);
      setMessages(data.messages ?? []);
    } catch (error) {
      console.error(
        "Conversation loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setInput("");
  }

  async function sendMessage(
    event?: FormEvent
  ) {
    event?.preventDefault();

    const message = input.trim();

    if (!message || loading) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      createdAt:
        new Date().toISOString(),
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/copilot",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message,
            conversationId,
          }),
        }
      );

      const data: CopilotResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.answer ||
            "Unable to get a Copilot response."
        );
      }

      if (data.conversationId) {
        setConversationId(
          data.conversationId
        );
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          data.answer ||
          "I wasn't able to generate a response.",
        createdAt:
          new Date().toISOString(),
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      await loadHistory();
    } catch (error) {
      console.error(
        "Copilot request error:",
        error
      );

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Something went wrong while contacting NEXUS Copilot.",
        createdAt:
          new Date().toISOString(),
      };

      setMessages((current) => [
        ...current,
        errorMessage,
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar */}

        <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border bg-card p-4 shadow-sm lg:flex">
          <button
            type="button"
            onClick={startNewConversation}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>

          <div className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            Recent conversations
          </div>

          <div className="space-y-1 overflow-y-auto">
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-10 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-2 py-4 text-xs text-muted-foreground">
                No conversations yet.
              </p>
            ) : (
              conversations.map(
                (conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() =>
                      loadConversation(
                        conversation.id
                      )
                    }
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                      conversationId ===
                      conversation.id
                        ? "bg-muted font-medium"
                        : ""
                    }`}
                  >
                    <div className="truncate">
                      {conversation.title ||
                        "New conversation"}
                    </div>

                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(
                        conversation.updatedAt
                      ).toLocaleDateString()}
                    </div>
                  </button>
                )
              )
            )}
          </div>
        </aside>

        {/* Chat */}

        <section className="flex min-h-[calc(100vh-3rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Header */}

          <header className="border-b px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h1 className="font-semibold">
                  NEXUS Career Copilot
                </h1>

                <p className="text-xs text-muted-foreground">
                  Your AI engineering career advisor
                </p>
              </div>

              <div className="ml-auto flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Context aware
              </div>
            </div>
          </header>

          {/* Messages */}

          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {messages.length === 0 ? (
              <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-16 text-center">
                <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                  <Bot className="h-8 w-8" />
                </div>

                <h2 className="mt-5 text-2xl font-bold">
                  How can I help your career?
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Ask NEXUS about your GitHub portfolio,
                  interview performance, skill gaps,
                  roadmap, projects, or Software Engineer
                  preparation.
                </p>

                <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                  {suggestions.map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() =>
                          setInput(
                            suggestion
                          )
                        }
                        className="rounded-xl border bg-muted/20 p-4 text-left text-sm transition-colors hover:bg-muted/50"
                      >
                        <MessageSquare className="mb-3 h-4 w-4 text-primary" />
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map(
                  (message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role ===
                        "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.role ===
                        "assistant" && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                          message.role ===
                          "user"
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border bg-muted/30"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>

                      {message.role ===
                        "user" && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  )
                )}

                {loading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>

                    <div className="rounded-2xl rounded-bl-md border bg-muted/30 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        NEXUS is thinking...
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}

          <div className="border-t bg-card p-4 sm:p-5">
            <form
              onSubmit={sendMessage}
              className="mx-auto max-w-3xl"
            >
              <div className="flex items-end gap-2 rounded-2xl border bg-muted/20 p-2 shadow-sm focus-within:border-primary/40">
                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask NEXUS about your career..."
                  rows={1}
                  maxLength={4000}
                  className="min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                />

                <button
                  type="submit"
                  disabled={
                    !input.trim() ||
                    loading
                  }
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Send message"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                NEXUS uses your career, GitHub, roadmap,
                and interview context to personalize responses.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}