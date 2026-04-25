"use client";

import Link from "next/link";
import { signIn as authSignIn, signOut as authSignOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_POST_LENGTH,
  defaultProfile,
  seedPosts,
  type Post,
  type Profile,
  type View,
} from "@/lib/dear-today-data";

const STORAGE_KEYS = {
  posts: "dear-today-posts",
  profile: "dear-today-profile",
  hearts: "dear-today-hearts",
  owned: "dear-today-owned-posts",
  deviceId: "dear-today-device-id",
  locale: "dear-today-locale",
  theme: "dear-today-theme",
};

const POST_PREVIEW_LENGTH = 80;

type Locale = "en" | "ko";
type FeedSort = "latest" | "today";
type MyPostsFilter = "all" | "public" | "hidden";
type ThemeMode = "light" | "evening";

const copy = {
  en: {
    nav: {
      home: "Home",
      myPosts: "My Posts",
      account: "Account",
    },
    profile: {
      menuLabel: "Open profile menu",
      guestLabel: "Guest",
      signedIn: "Signed in with Google",
      signedOut: "Not signed in",
      nicknameHelp: "This name appears on future signed-in notes.",
    },
    prompts: [
      "What felt quietly kind today?",
      "Which small moment made the day softer?",
      "Who or what held you up, even briefly?",
    ],
    common: {
      brandEyebrow: "today's gratitude journal",
      defaultGuest: "Quiet guest",
      noComments: "No comments",
      heartOnly: "Heart-only reactions",
      calmMobile: "Calm mobile reading",
      writeNote: "Write a note",
      manageAccess: "Manage access",
      openMyPosts: "Open My Posts",
      continueGoogle: "Continue with Google",
      guestPassword: "Guest password",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      saveChanges: "Save changes",
      deleteNote: "Delete note",
      quietHearts: "quiet hearts",
      signOut: "Sign out",
      publicNote: "Public",
      privateNote: "Only me",
      themeLight: "Day",
      themeEvening: "Night",
    },
    home: {
      eyebrow: "Public gratitude journal",
      title: "A quiet place to leave one small note of gratitude.",
      subtitle:
        "Write without pressure, read without noise, and leave a soft heart when something meets you gently.",
      writeCta: "Write",
      readCta: "Read today's notes",
      promptEyebrow: "Today's gentle prompt",
      promptBody:
        "You can answer it, ignore it, or write something completely your own. The point is to make starting feel lighter.",
      promiseLabel: "Emotional promise",
      promise:
        "Not a noisy social feed. Not a private diary. Just a warm public ritual for a softer end to the day.",
      quickNote: "Quick note",
      openComposer: "Leave a note",
      closeComposer: "Close writing",
      notePlaceholder: "One thing I am grateful for today...",
      authorPlaceholder: "Posting nickname",
      passwordPlaceholder: "Guest password for edits",
      addNote: "Add note",
      adding: "Adding...",
      visibilityHelpMember:
        "Public notes appear in the home feed. Only-me notes stay in My Posts.",
      visibilityHelpGuest:
        "Guest notes are public. Sign in when you want an only-me note.",
      featuredEyebrow: "Featured gratitude",
      featuredTitle: "A note carrying today's warmth",
      shareFeeling: "Share this feeling",
      featuredMeta: "Words, warmth, and quiet appreciation.",
      sortLatest: "Latest",
      sortToday: "Today's hearts",
      newNotes: (count: number) =>
        count === 1 ? "1 new gratitude note" : `${count} new gratitude notes`,
      showNewNotes: "Show them",
      sortHint: "Recent 24h first, then older notes by latest.",
      rhythmEyebrow: "Writing",
      rhythmTitle: "Leave one note when something comes to mind.",
      rhythmBody:
        "The editor stays tucked away until you need it, so reading remains calm and writing still feels close.",
      latestEyebrow: "Latest gratitude feed",
      latestTitle: "Recent notes from today",
      showLess: "Show less",
      readMore: "Read more",
      archiveEyebrow: "My posts",
      archiveTitleMember: "Notes you can revisit",
      archiveTitleGuest: "Sign in to keep an archive",
      archiveBodyMember:
        "Your signed-in notes stay gathered here for edits, deletions, and soft rereading.",
      archiveBodyGuest:
        "Guest posting stays light and public. My Posts becomes available when you use an account.",
      archiveEmptyMember: "Your first signed-in note will appear here after you write.",
      archiveEmptyGuest:
        "Continue with Google to turn My Posts into a private-feeling archive.",
      accountEyebrow: "Account",
      accountTitle: "Low-pressure ownership",
      accountBody:
        "Start as a guest, or switch on Google-first access for a smoother posting flow later.",
      currentMode: "Current mode:",
      accountMode: "google account",
      guestMode: "guest posting",
      memberHint: "Member mode skips guest password for new posts in this prototype.",
      guestHint: "Guest mode keeps things lightweight, with password checks for edit/delete.",
      guestWrite: "Write as guest",
    },
    myPosts: {
      eyebrow: "Archive",
      title: "Your quiet archive",
      heroTitleMember: "Your gratitude notes, held in one quiet place.",
      heroTitleGuest: "A calmer archive starts with sign-in.",
      heroBodyMember:
        "Your archive is for rereading, refining, or letting go. It should feel calm and safe, never like account admin.",
      heroBodyGuest:
        "Guest notes stay lightweight and public; My Posts is reserved for an account-based personal archive.",
      sideTitleMember: "Signed-in notes are gathered for calm review.",
      sideTitleGuest: "Guest edits stay on the public card.",
      sideBodyMember:
        "This view stays focused on account-owned writing so it feels like a true personal space.",
      sideBodyGuest:
        "Use the feed card and your guest password to manage a guest note; sign in when you want a lasting archive.",
      bodyMember:
        "Edit or delete notes written while signed in. Guest notes stay managed from their public cards.",
      bodyGuest:
        "My Posts is available after sign-in so guest posting can stay lightweight and low-pressure.",
      emptyMember:
        "No signed-in notes yet. Write one small gratitude note while signed in, and it will appear here for later revisiting.",
      guestTitle: "Keep writing freely as a guest.",
      guestBody:
        "Guest notes are public and can be managed from their feed card with the password you set. Sign in when you want a dedicated personal archive.",
      filterAll: "All",
      filterPublic: "Public",
      filterPrivate: "Only me",
      privateBadge: "Only me",
    },
    account: {
      eyebrow: "Account access",
      title: "Account",
      heroTitle: "Manage the name shown on your notes.",
      heroBody:
        "Choose a posting nickname, review your signed-in state, or sign out.",
      sideMember: (name: string) => `${name} is using Google.`,
      sideGuest: "Guest mode is active right now.",
      sideBody:
        "This draft keeps authentication intentionally light while preserving a future Google-first path and clear guest ownership.",
      currentState: "Current state",
      usingGoogle: (name: string) => `${name} using Google`,
      guestEnabled: "Guest mode enabled",
      authBody: "This is the account connected to your signed-in notes.",
      whyTitle: "Signed-in writing",
      whyItems: ["No guest password for new notes", "Your notes appear in My Posts"],
      nicknameTitle: "Posting nickname",
      nicknameBody:
        "This is the name shown on future gratitude notes. It does not change your Google account name.",
      nicknameFirstHelp:
        "You can set this freely once. After that, it can be changed once every 7 days.",
      nicknameNextChange: (date: string) => `Next nickname change: ${date}.`,
      nicknamePlaceholder: "Your quiet pen name",
      saveNickname: "Save nickname",
      saving: "Saving...",
      signOut: "Sign out",
    },
    modal: {
      editEyebrow: "Edit note",
      deleteEyebrow: "Delete note",
      editTitle: "Refine your gratitude note",
      deleteTitle: "Remove this note from your archive?",
      editBody:
        "Guest notes require the password you used when writing. Logged-in posts can be updated directly.",
      deleteBody:
        "This action is permanent in the prototype. Guest notes require password verification first.",
      passwordPlaceholder: "Password for this note",
    },
    messages: {
      posted: "Your gratitude is now part of today's warmth.",
      guestPasswordFirst: "Please enter the password you set when writing this note.",
      passwordMismatch: "That password is not right. Check the password you used for this note.",
      verifyFailed: "This note could not be changed. Use the password set when it was written.",
      databaseFailed: "We could not reach the database. Please try again.",
      accessFailed: "We could not start account access yet. Please try again.",
      nicknameLength: "Choose a nickname between 2 and 40 characters.",
      nicknameUpdated: "Your posting nickname has been updated.",
      nicknameLimited: (date: string) =>
        `You can change your nickname again on ${date}.`,
      nicknameFailed: "We could not update your nickname yet. Please try again.",
    },
  },
  ko: {
    nav: {
      home: "홈",
      myPosts: "내 글",
      account: "계정",
    },
    profile: {
      menuLabel: "프로필 메뉴 열기",
      guestLabel: "게스트",
      signedIn: "Google로 로그인 중",
      signedOut: "로그인하지 않음",
      nicknameHelp: "앞으로 쓰는 로그인 글에 표시될 이름입니다.",
    },
    prompts: [
      "오늘 조용히 다정했던 순간은 무엇이었나요?",
      "오늘을 조금 더 부드럽게 만든 작은 장면은 무엇이었나요?",
      "짧게라도 나를 붙잡아준 사람이나 일은 무엇이었나요?",
    ],
    common: {
      brandEyebrow: "오늘의 감사일기",
      defaultGuest: "익명의 마음",
      noComments: "댓글 없음",
      heartOnly: "하트 하나만",
      calmMobile: "차분한 모바일 읽기",
      writeNote: "글 남기기",
      manageAccess: "계정 관리",
      openMyPosts: "내 글 보기",
      continueGoogle: "Google로 계속하기",
      guestPassword: "게스트 비밀번호",
      edit: "수정",
      delete: "삭제",
      cancel: "취소",
      saveChanges: "변경 저장",
      deleteNote: "글 삭제",
      quietHearts: "개의 조용한 하트",
      signOut: "로그아웃",
      publicNote: "공개",
      privateNote: "나만 보기",
      themeLight: "낮",
      themeEvening: "밤",
    },
    home: {
      eyebrow: "공개 감사 저널",
      title: "오늘 고마웠던 일을 짧게 남겨보세요.",
      subtitle:
        "누군가의 감사한 순간을 읽고, 마음이 닿으면 하트를 남겨요. 댓글 없이 조용하게 이어지는 공간입니다.",
      writeCta: "글쓰기",
      readCta: "최근 글 보기",
      promptEyebrow: "오늘의 질문",
      promptBody:
        "꼭 질문에 답하지 않아도 괜찮아요. 오늘 마음에 남은 고마운 장면 하나면 충분합니다.",
      promiseLabel: "이 공간의 약속",
      promise:
        "소란스러운 SNS도, 완전히 혼자 쓰는 일기도 아닙니다. 서로의 감사한 순간을 조용히 읽는 곳입니다.",
      quickNote: "감사 남기기",
      openComposer: "글쓰기 열기",
      closeComposer: "글쓰기 닫기",
      notePlaceholder: "오늘 고마웠던 일을 적어보세요...",
      authorPlaceholder: "글에 표시될 이름",
      passwordPlaceholder: "수정·삭제용 비밀번호",
      addNote: "남기기",
      adding: "저장 중...",
      visibilityHelpMember:
        "공개 글은 홈 피드에 보이고, 나만 보기 글은 내 글에만 저장됩니다.",
      visibilityHelpGuest:
        "게스트 글은 공개로만 남길 수 있어요. 나만 보기 글은 로그인 후 사용할 수 있습니다.",
      featuredEyebrow: "오늘의 글",
      featuredTitle: "마음에 남은 감사",
      shareFeeling: "공유하기",
      featuredMeta: "댓글 없이, 하트로만 전해요.",
      sortLatest: "최근",
      sortToday: "오늘 공감",
      newNotes: (count: number) => `새 감사 ${count}개가 도착했어요`,
      showNewNotes: "보기",
      sortHint: "최근 24시간 글을 먼저, 이후 글은 최신순으로 보여줘요.",
      rhythmEyebrow: "글쓰기",
      rhythmTitle: "쓰고 싶을 때만 열어두세요.",
      rhythmBody:
        "글쓰기 카드는 필요할 때만 펼쳐집니다. 그래서 피드는 계속 읽기 편하고, 쓰기는 가까이에 있습니다.",
      latestEyebrow: "최근 글",
      latestTitle: "방금 남겨진 감사들",
      showLess: "접기",
      readMore: "더 읽기",
      archiveEyebrow: "내 글",
      archiveTitleMember: "내가 남긴 글",
      archiveTitleGuest: "로그인하면 내 글을 모아볼 수 있어요",
      archiveBodyMember:
        "로그인 후 쓴 글은 수정, 삭제, 다시 읽기를 위해 이곳에 모입니다.",
      archiveBodyGuest:
        "게스트 글쓰기는 가볍고 공개적으로 유지됩니다. 계정을 사용하면 내 글 보관함이 열립니다.",
      archiveEmptyMember: "로그인 상태에서 첫 글을 쓰면 여기에 나타납니다.",
      archiveEmptyGuest: "Google로 계속하면 내 글을 조용한 보관함처럼 사용할 수 있습니다.",
      accountEyebrow: "계정",
      accountTitle: "계정",
      accountBody:
        "게스트로 시작하거나, 더 부드러운 글쓰기 흐름을 위해 Google 계정을 사용할 수 있습니다.",
      currentMode: "현재 모드:",
      accountMode: "google 계정",
      guestMode: "게스트 글쓰기",
      memberHint: "회원 모드는 새 글 작성 시 게스트 비밀번호가 필요 없습니다.",
      guestHint: "게스트 모드는 가볍게 쓰고, 수정/삭제 때 비밀번호를 확인합니다.",
      guestWrite: "게스트로 쓰기",
    },
    myPosts: {
      eyebrow: "보관함",
      title: "내 글",
      heroTitleMember: "내 감사 글을 한곳에 조용히 모아둡니다.",
      heroTitleGuest: "차분한 보관함은 로그인 후 시작됩니다.",
      heroBodyMember:
        "다시 읽고, 다듬고, 필요하면 내려놓을 수 있는 공간입니다. 계정 관리처럼 딱딱하지 않아야 합니다.",
      heroBodyGuest:
        "게스트 글은 가볍고 공개적으로 유지됩니다. 내 글은 계정 기반 개인 보관함입니다.",
      sideTitleMember: "로그인 후 쓴 글은 차분히 모입니다.",
      sideTitleGuest: "게스트 글 수정은 공개 카드에서 합니다.",
      sideBodyMember:
        "이 화면은 계정으로 쓴 글만 다루어 진짜 개인 공간처럼 느껴지게 합니다.",
      sideBodyGuest:
        "게스트 글은 피드 카드에서 비밀번호로 관리하세요. 오래 보관하고 싶을 때 로그인하면 됩니다.",
      bodyMember:
        "로그인 상태에서 작성한 글을 수정하거나 삭제할 수 있습니다. 게스트 글은 공개 카드에서 관리합니다.",
      bodyGuest:
        "내 글은 로그인 후 사용할 수 있어, 게스트 글쓰기는 계속 가볍게 유지됩니다.",
      emptyMember:
        "아직 로그인 상태에서 쓴 글이 없습니다. 작은 감사 글을 하나 남기면 여기에 나타납니다.",
      guestTitle: "게스트로도 자유롭게 쓸 수 있어요.",
      guestBody:
        "게스트 글은 공개되며, 작성 시 설정한 비밀번호로 피드 카드에서 관리할 수 있습니다. 전용 보관함이 필요할 때 로그인하세요.",
      filterAll: "전체",
      filterPublic: "공개",
      filterPrivate: "나만 보기",
      privateBadge: "나만 보기",
    },
    account: {
      eyebrow: "계정",
      title: "계정 관리",
      heroTitle: "글에 표시될 이름을 관리하세요.",
      heroBody:
        "작성 별명을 바꾸거나, 로그인 상태를 확인하고, 필요하면 로그아웃할 수 있습니다.",
      sideMember: (name: string) => `${name}님으로 로그인 중입니다.`,
      sideGuest: "로그인하지 않은 상태입니다.",
      sideBody:
        "이 초안은 인증을 가볍게 유지하면서도 Google 우선 경로와 명확한 게스트 소유권을 준비합니다.",
      currentState: "로그인 상태",
      usingGoogle: (name: string) => `${name}님으로 로그인 중`,
      guestEnabled: "로그인하지 않음",
      authBody: "로그인 후 작성한 글은 내 글에서 다시 볼 수 있습니다.",
      whyTitle: "로그인하면",
      whyItems: ["새 글에 비밀번호가 필요 없습니다", "내 글에서 작성한 글을 모아볼 수 있습니다"],
      nicknameTitle: "작성자 이름",
      nicknameBody:
        "앞으로 쓰는 글에 표시될 이름입니다. Google 계정 이름은 바뀌지 않습니다.",
      nicknameFirstHelp:
        "처음 설정은 자유롭게 할 수 있고, 이후에는 7일에 한 번 바꿀 수 있어요.",
      nicknameNextChange: (date: string) => `다음 별명 변경 가능: ${date}`,
      nicknamePlaceholder: "예: 하루",
      saveNickname: "저장하기",
      saving: "저장 중...",
      signOut: "로그아웃",
    },
    modal: {
      editEyebrow: "글 수정",
      deleteEyebrow: "글 삭제",
      editTitle: "감사 글 다듬기",
      deleteTitle: "이 글을 보관함에서 삭제할까요?",
      editBody:
        "게스트 글은 작성할 때 사용한 비밀번호가 필요합니다. 로그인 글은 바로 수정할 수 있습니다.",
      deleteBody:
        "프로토타입에서는 이 작업을 되돌릴 수 없습니다. 게스트 글은 먼저 비밀번호를 확인합니다.",
      passwordPlaceholder: "이 글의 비밀번호",
    },
    messages: {
      posted: "당신의 감사가 오늘의 온기에 더해졌습니다.",
      guestPasswordFirst: "이 글을 쓸 때 정한 비밀번호를 입력해주세요.",
      passwordMismatch: "비밀번호가 맞지 않아요. 이 글을 쓸 때 정한 비밀번호를 확인해주세요.",
      verifyFailed: "이 글을 변경할 수 없어요. 작성할 때 정한 비밀번호로 다시 시도해주세요.",
      databaseFailed: "데이터베이스에 연결하지 못했습니다. 다시 시도해주세요.",
      accessFailed: "계정 접근을 시작하지 못했습니다. 다시 시도해주세요.",
      nicknameLength: "별명은 2자 이상 40자 이하로 입력해주세요.",
      nicknameUpdated: "작성 별명이 업데이트되었습니다.",
      nicknameLimited: (date: string) =>
        `별명은 ${date} 이후 다시 바꿀 수 있어요.`,
      nicknameFailed: "별명을 업데이트하지 못했습니다. 다시 시도해주세요.",
    },
  },
};

type FormState = {
  body: string;
  author: string;
  password: string;
  visibility: "public" | "hidden";
};

type ApiEntry = {
  id: string;
  body: string;
  authorName: string;
  heartCount: number;
  viewerHasHearted: boolean;
  createdAt: string;
  visibility: "public" | "hidden";
  canEdit: boolean;
};

type AuthProfilePayload = {
  id: string;
  provider: "google";
  displayName: string;
  avatarUrl?: string | null;
  displayNameChangedAt?: string | null;
  nextDisplayNameChangeAt?: string | null;
};

const navItems: { href: string; labelKey: keyof typeof copy.en.nav; view: View }[] = [
  { href: "/", labelKey: "home", view: "home" },
  { href: "/my-posts", labelKey: "myPosts", view: "my-posts" },
];

const initialForm = {
  body: "",
  author: "",
  password: "",
  visibility: "public" as const,
};

function readStorage<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function persistStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function applyDocumentTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
}

function getOrCreateDeviceId() {
  const existing = readStorage<string | null>(STORAGE_KEYS.deviceId, null);

  if (existing) {
    return existing;
  }

  const nextId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}`;

  persistStorage(STORAGE_KEYS.deviceId, nextId);
  return nextId;
}

function formatRelative(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatCalendarDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en", {
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

function truncateText(body: string, expanded: boolean) {
  if (expanded || body.length <= POST_PREVIEW_LENGTH) {
    return body;
  }

  return `${body.slice(0, POST_PREVIEW_LENGTH).trimEnd()}...`;
}

function mapApiEntryToPost(entry: ApiEntry): Post {
  return {
    id: entry.id,
    body: entry.body,
    author: entry.authorName,
    createdAt: entry.createdAt,
    hearts: entry.heartCount,
    visibility: entry.visibility,
  };
}

function mergePosts(primaryPosts: Post[], secondaryPosts: Post[]) {
  const seen = new Set<string>();

  return [...primaryPosts, ...secondaryPosts].filter((post) => {
    if (seen.has(post.id)) {
      return false;
    }

    seen.add(post.id);
    return true;
  });
}

function getPostTime(post: Post) {
  return new Date(post.createdAt).getTime();
}

function sortFeedPosts(posts: Post[], sort: FeedSort, referenceTime: number) {
  if (sort === "latest" || referenceTime === 0) {
    return [...posts].sort((a, b) => getPostTime(b) - getPostTime(a));
  }

  const cutoff = referenceTime - 24 * 60 * 60 * 1000;

  return [...posts].sort((a, b) => {
    const aTime = getPostTime(a);
    const bTime = getPostTime(b);
    const aToday = aTime >= cutoff;
    const bToday = bTime >= cutoff;

    if (aToday !== bToday) {
      return aToday ? -1 : 1;
    }

    if (aToday && bToday && a.hearts !== b.hearts) {
      return b.hearts - a.hearts;
    }

    return bTime - aTime;
  });
}

function mergeUniqueStable(current: string[], additions: string[]) {
  const next = [...new Set([...additions, ...current])];

  if (next.length === current.length && next.every((id, index) => id === current[index])) {
    return current;
  }

  return next;
}

function isDatabaseEntryId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function mapAuthProfile(profile: AuthProfilePayload): Profile {
  return {
    mode: "member",
    id: profile.id,
    provider: "google",
    name: profile.displayName,
    avatarUrl: profile.avatarUrl ?? null,
    displayNameChangedAt: profile.displayNameChangedAt ?? null,
    nextDisplayNameChangeAt: profile.nextDisplayNameChangeAt ?? null,
  };
}

function profileBadgeLabel(profile: Profile, locale: Locale) {
  if (profile.mode === "guest") {
    return locale === "ko" ? "게스트" : "Guest";
  }

  return profile.name.trim().charAt(0).toUpperCase() || "D";
}

function ProfileGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <path d="M12 12.4a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Z" />
      <path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}

export function DearTodayApp({ initialView }: { initialView: View }) {
  const isHome = initialView === "home";
  const isWrite = initialView === "write";
  const isMyPosts = initialView === "my-posts";
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [heartedIds, setHeartedIds] = useState<string[]>([]);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [profileOwnedIds, setProfileOwnedIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>({
    ...initialForm,
    author: defaultProfile.name,
  });
  const [selectedPromptIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [verification, setVerification] = useState("");
  const [verificationError, setVerificationError] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(defaultProfile.name);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [feedSort, setFeedSort] = useState<FeedSort>("latest");
  const [myPostsFilter, setMyPostsFilter] = useState<MyPostsFilter>("all");
  const [sortReferenceTime, setSortReferenceTime] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [isCheckingFeed, setIsCheckingFeed] = useState(false);
  const postsRef = useRef(posts);
  const [, setApiStatus] = useState<
    "idle" | "loading" | "ready" | "fallback"
  >("idle");
  const c = copy[locale];
  const selectedPrompt = c.prompts[selectedPromptIndex];
  const reactionActor =
    profile.mode === "member"
      ? ({ kind: "profile", profileId: profile.id } as const)
      : ({ kind: "device", deviceId } as const);
  const reactionActorKey =
    profile.mode === "member" ? `profile:${profile.id}` : `device:${deviceId}`;

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const nextDeviceId = getOrCreateDeviceId();
      const storedLocale = readStorage<Locale | null>(STORAGE_KEYS.locale, null);
      const browserLocale: Locale = navigator.language.startsWith("ko")
        ? "ko"
        : "en";
      const nextLocale = storedLocale ?? browserLocale;
      const storedTheme = readStorage<ThemeMode | null>(STORAGE_KEYS.theme, null);
      const systemTheme: ThemeMode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "evening"
        : "light";
      const nextTheme = storedTheme ?? systemTheme;
      const storedPosts = readStorage<Post[]>(STORAGE_KEYS.posts, seedPosts);
      const storedProfile = readStorage<Profile>(
        STORAGE_KEYS.profile,
        defaultProfile,
      );
      const safeProfile =
        storedProfile.mode === "member" && !("id" in storedProfile)
          ? defaultProfile
          : storedProfile;
      const storedHearts = readStorage<string[]>(STORAGE_KEYS.hearts, []);
      const storedOwned = readStorage<string[]>(STORAGE_KEYS.owned, []);
      const localizedGuestProfile: Profile =
        safeProfile.mode === "guest" && safeProfile.name === defaultProfile.name
          ? {
              mode: "guest",
              name: copy[nextLocale].common.defaultGuest,
            }
          : safeProfile;

      setPosts(storedPosts);
      setProfile(localizedGuestProfile);
      setHeartedIds(storedHearts);
      setOwnedIds(storedOwned);
      setLocale(nextLocale);
      setTheme(nextTheme);
      applyDocumentTheme(nextTheme);
      setDeviceId(nextDeviceId);
      setHasHydrated(true);
      setSortReferenceTime(Date.now());
      setForm((current) => ({
        ...current,
        author: localizedGuestProfile.name,
      }));
      setNicknameDraft(localizedGuestProfile.name);
    }, 0);

    return () => {
      window.clearTimeout(hydrate);
    };
  }, []);

  useEffect(() => {
    if (!actionMenuId) {
      return;
    }

    const closeMenu = () => setActionMenuId(null);

    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [actionMenuId]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const closeMenu = () => setIsProfileMenuOpen(false);

    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistStorage(STORAGE_KEYS.locale, locale);
    document.documentElement.lang = locale === "ko" ? "ko" : "en";
  }, [hasHydrated, locale]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistStorage(STORAGE_KEYS.theme, theme);
    document.documentElement.dataset.theme = theme;
  }, [hasHydrated, theme]);

  useEffect(() => {
    if (!deviceId || !hasHydrated) {
      return;
    }

    const controller = new AbortController();

    async function loadEntries() {
      setApiStatus("loading");

      try {
        const response = await fetch(
          `/api/entries?actorKey=${encodeURIComponent(reactionActorKey)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setApiStatus("fallback");
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          entries?: ApiEntry[];
        };

        if (!payload.ok || !payload.entries) {
          setApiStatus("fallback");
          return;
        }

        const latestEntries = payload.entries;
        const latestPosts = latestEntries.map(mapApiEntryToPost);
        let ownedEntries: ApiEntry[] = [];
        const missingOwnedIds = ownedIds.filter(
          (id) =>
            isDatabaseEntryId(id) &&
            !latestEntries.some((entry) => entry.id === id),
        );

        if (missingOwnedIds.length > 0) {
          const ownedResponse = await fetch(
            `/api/entries?actorKey=${encodeURIComponent(
              reactionActorKey,
            )}&ids=${encodeURIComponent(missingOwnedIds.join(","))}`,
            {
              signal: controller.signal,
            },
          );

          if (ownedResponse.ok) {
            const ownedPayload = (await ownedResponse.json()) as {
              ok: boolean;
              entries?: ApiEntry[];
            };
            ownedEntries = ownedPayload.ok ? (ownedPayload.entries ?? []) : [];
          }
        }

        const allEntries = [...latestEntries, ...ownedEntries];
        const apiPosts = mergePosts(
          latestPosts,
          ownedEntries.map(mapApiEntryToPost),
        );

        if (apiPosts.length > 0) {
          setPosts((current) =>
            mergePosts(
              apiPosts,
              current.filter((post) => (post.visibility ?? "public") === "hidden"),
            ),
          );
          const apiEntryIds = allEntries.map((entry) => entry.id);
          const apiHeartedIds = allEntries
            .filter((entry) => entry.viewerHasHearted)
            .map((entry) => entry.id);
          setHeartedIds((current) =>
            mergeUniqueStable(
              current.filter((id) => !apiEntryIds.includes(id)),
              apiHeartedIds,
            ),
          );
          const editableIds = allEntries
            .filter((entry) => entry.canEdit)
            .map((entry) => entry.id);

          setOwnedIds((current) => mergeUniqueStable(current, editableIds));
          setProfileOwnedIds((current) => mergeUniqueStable(current, editableIds));
        }
        setApiStatus("ready");
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Failed to load API entries", error);
          setApiStatus("fallback");
        }
      }
    }

    loadEntries();

    return () => controller.abort();
  }, [deviceId, hasHydrated, ownedIds, reactionActorKey]);

  useEffect(() => {
    if (!deviceId || !hasHydrated || !isHome) {
      return;
    }

    let ignore = false;

    async function checkForNewEntries() {
      if (document.visibilityState !== "visible") {
        return;
      }

      setIsCheckingFeed(true);

      try {
        const response = await fetch(
          `/api/entries?actorKey=${encodeURIComponent(reactionActorKey)}`,
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          entries?: ApiEntry[];
        };

        if (!payload.ok || !payload.entries || ignore) {
          return;
        }

        const knownIds = new Set(postsRef.current.map((post) => post.id));
        const nextPendingPosts = payload.entries
          .filter((entry) => !knownIds.has(entry.id))
          .map(mapApiEntryToPost);

        setPendingPosts((current) => mergePosts(current, nextPendingPosts));
      } catch {
        // Realtime awareness is intentionally quiet; polling failures should not interrupt reading.
      } finally {
        if (!ignore) {
          setIsCheckingFeed(false);
        }
      }
    }

    const firstCheck = window.setTimeout(checkForNewEntries, 12000);
    const interval = window.setInterval(checkForNewEntries, 30000);

    return () => {
      ignore = true;
      window.clearTimeout(firstCheck);
      window.clearInterval(interval);
    };
  }, [deviceId, hasHydrated, isHome, reactionActorKey]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let ignore = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/account/session");

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          profile?: AuthProfilePayload | null;
        };

        if (!ignore && payload.ok && payload.profile) {
          const nextProfile = mapAuthProfile(payload.profile);
          setProfile(nextProfile);
          setForm((current) => ({
            ...current,
            author: nextProfile.name,
            password: "",
          }));
          setNicknameDraft(nextProfile.name);
        }
      } catch {
        // Session hydration is progressive; guest mode remains the safe fallback.
      }
    }

    loadSession();

    return () => {
      ignore = true;
    };
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || profile.mode !== "member") {
      return;
    }

    const controller = new AbortController();

    async function loadProfileEntries() {
      try {
        const response = await fetch("/api/entries?mine=1", {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          entries?: ApiEntry[];
        };

        if (!payload.ok || !payload.entries) {
          return;
        }

        const profilePosts = payload.entries.map(mapApiEntryToPost);
        setPosts((current) => mergePosts(profilePosts, current));
        setProfileOwnedIds((current) =>
          mergeUniqueStable(
            current,
            profilePosts.map((post) => post.id),
          ),
        );
        setOwnedIds((current) => {
          const nextIds = profilePosts.map((post) => post.id);

          return mergeUniqueStable(current, nextIds);
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Failed to load profile entries", error);
        }
      }
    }

    loadProfileEntries();

    return () => controller.abort();
  }, [hasHydrated, profile]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistStorage(STORAGE_KEYS.posts, posts);
  }, [hasHydrated, posts]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistStorage(STORAGE_KEYS.profile, profile);
  }, [hasHydrated, profile]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistStorage(STORAGE_KEYS.hearts, heartedIds);
  }, [hasHydrated, heartedIds]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistStorage(STORAGE_KEYS.owned, ownedIds);
  }, [hasHydrated, ownedIds]);

  const visiblePosts = useMemo(
    () =>
      sortFeedPosts(
        posts.filter((post) => (post.visibility ?? "public") === "public"),
        feedSort,
        sortReferenceTime,
      ),
    [feedSort, posts, sortReferenceTime],
  );
  const canUsePersonalArchive = profile.mode === "member";
  const archivedPosts = useMemo(() => {
    if (!canUsePersonalArchive) {
      return [];
    }

    return sortFeedPosts(
      posts.filter((post) => {
        if (!profileOwnedIds.includes(post.id)) {
          return false;
        }

        const visibility = post.visibility ?? "public";

        return myPostsFilter === "all" || visibility === myPostsFilter;
      }),
      "latest",
      sortReferenceTime,
    );
  }, [canUsePersonalArchive, myPostsFilter, posts, profileOwnedIds, sortReferenceTime]);

  const canSubmit =
    form.body.trim().length >= 12 &&
    form.body.length <= MAX_POST_LENGTH &&
    form.author.trim().length >= 2 &&
    (profile.mode === "member" || form.password.trim().length >= 4);

  const toggleHeart = async (postId: string) => {
    const alreadyHearted = heartedIds.includes(postId);

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              hearts: Math.max(0, post.hearts + (alreadyHearted ? -1 : 1)),
            }
          : post,
      ),
    );

    setHeartedIds((current) =>
      alreadyHearted
        ? current.filter((id) => id !== postId)
        : [...current, postId],
    );

    if (!deviceId) {
      return;
    }

    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          entryId: postId,
          actor: {
            ...reactionActor,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Heart request failed");
      }
    } catch {
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                hearts: Math.max(0, post.hearts + (alreadyHearted ? 1 : -1)),
              }
            : post,
        ),
      );
      setHeartedIds((current) =>
        alreadyHearted
          ? [...current, postId]
          : current.filter((id) => id !== postId),
      );
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    let entryId = createLocalId("post");
    setIsSubmitting(true);
    setSuccessMessage("");
    setLastCreatedId(null);

    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          body: form.body.trim(),
          visibility: profile.mode === "member" ? form.visibility : "public",
          owner:
            profile.mode === "member"
              ? {
                  kind: "profile",
                  profileId: profile.id,
                  authorName: form.author.trim(),
                }
              : {
                  kind: "guest",
                  authorName: form.author.trim(),
                  password: form.password,
                },
          locale: navigator.language,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        entryId?: string;
        errors?: string[];
      };

      if (response.ok && payload.ok && payload.entryId) {
        entryId = payload.entryId;
        setApiStatus("ready");
      } else {
        setApiStatus("fallback");
      }
    } catch {
      setApiStatus("fallback");
    }

    const newPost: Post = {
      id: entryId,
      author: form.author.trim(),
      body: form.body.trim(),
      createdAt: new Date().toISOString(),
      hearts: 0,
      visibility: profile.mode === "member" ? form.visibility : "public",
      ownerId: profile.mode === "member" ? profile.id : createLocalId("guest"),
      guestPassword: profile.mode === "member" ? undefined : form.password,
    };

    setPosts((current) => [newPost, ...current]);
    setOwnedIds((current) =>
      current.includes(newPost.id) ? current : [newPost.id, ...current],
    );
    if (profile.mode === "member") {
      setProfileOwnedIds((current) =>
        current.includes(newPost.id) ? current : [newPost.id, ...current],
      );
      void updateNickname(form.author, { silent: true });
    }
    setForm({
      body: "",
      author: profile.mode === "member" ? form.author.trim() : profile.name,
      password: "",
      visibility: "public",
    });
    setLastCreatedId(newPost.id);
    setIsSubmitting(false);
    setSuccessMessage(c.messages.posted);
    setIsComposerOpen(false);
  };

  const startEdit = (post: Post) => {
    setEditingId(post.id);
    setActionMenuId(null);
    setEditingDraft(post.body);
    setVerification("");
    setVerificationError(false);
  };

  const requiresGuestVerification = (post: Post) =>
    !(
      profile.mode === "member" &&
      profileOwnedIds.includes(post.id) &&
      isDatabaseEntryId(post.id)
    );

  const showVerificationError = (message: string) => {
    setSuccessMessage(message);
    setVerificationError(false);
    window.requestAnimationFrame(() => setVerificationError(true));
    setTimeout(() => {
      setVerificationError(false);
      setSuccessMessage("");
    }, 2600);
  };

  const saveEdit = async () => {
    if (!editingId || editingDraft.trim().length < 12) {
      return;
    }

    const post = posts.find((item) => item.id === editingId);
    if (!post) {
      return;
    }

    if (!isDatabaseEntryId(editingId) && !ownedIds.includes(editingId)) {
      showVerificationError(c.messages.verifyFailed);
      return;
    }

    const needsPassword = requiresGuestVerification(post);
    const isProfileDatabaseOwner =
      profile.mode === "member" &&
      profileOwnedIds.includes(post.id) &&
      isDatabaseEntryId(editingId);
    const hasLocalPasswordMismatch =
      post.guestPassword && verification.trim() !== post.guestPassword;

    if (needsPassword && verification.trim().length < 4) {
      showVerificationError(c.messages.guestPasswordFirst);
      return;
    }

    if (hasLocalPasswordMismatch) {
      showVerificationError(c.messages.passwordMismatch);
      return;
    }

    if (isDatabaseEntryId(editingId)) {
      try {
        const response = await fetch(`/api/entries/${editingId}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            body: editingDraft.trim(),
            actor:
              isProfileDatabaseOwner
                ? {
                    kind: "profile",
                    profileId: profile.id,
                  }
                : {
                    kind: "guest",
                    password: verification,
                  },
          }),
        });

        if (!response.ok) {
          showVerificationError(c.messages.verifyFailed);
          return;
        }
      } catch {
        setSuccessMessage(c.messages.databaseFailed);
        setTimeout(() => setSuccessMessage(""), 2600);
        return;
      }
    }

    setPosts((current) =>
      current.map((item) =>
        item.id === editingId ? { ...item, body: editingDraft.trim() } : item,
      ),
    );
    setEditingId(null);
    setEditingDraft("");
    setVerification("");
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    const post = posts.find((item) => item.id === deleteCandidate);
    if (!post) {
      return;
    }

    if (!isDatabaseEntryId(deleteCandidate) && !ownedIds.includes(deleteCandidate)) {
      showVerificationError(c.messages.verifyFailed);
      return;
    }

    const needsPassword = requiresGuestVerification(post);
    const isProfileDatabaseOwner =
      profile.mode === "member" &&
      profileOwnedIds.includes(post.id) &&
      isDatabaseEntryId(deleteCandidate);
    const hasLocalPasswordMismatch =
      post.guestPassword && verification.trim() !== post.guestPassword;

    if (needsPassword && verification.trim().length < 4) {
      showVerificationError(c.messages.guestPasswordFirst);
      return;
    }

    if (hasLocalPasswordMismatch) {
      showVerificationError(c.messages.passwordMismatch);
      return;
    }

    if (isDatabaseEntryId(deleteCandidate)) {
      try {
        const response = await fetch(`/api/entries/${deleteCandidate}`, {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            actor:
              isProfileDatabaseOwner
                ? {
                    kind: "profile",
                    profileId: profile.id,
                  }
                : {
                    kind: "guest",
                    password: verification,
                  },
          }),
        });

        if (!response.ok) {
          showVerificationError(c.messages.verifyFailed);
          return;
        }
      } catch {
        setSuccessMessage(c.messages.databaseFailed);
        setTimeout(() => setSuccessMessage(""), 2600);
        return;
      }
    }

    setPosts((current) => current.filter((item) => item.id !== deleteCandidate));
    setOwnedIds((current) => current.filter((id) => id !== deleteCandidate));
    setProfileOwnedIds((current) => current.filter((id) => id !== deleteCandidate));
    setDeleteCandidate(null);
    setVerification("");
  };

  const enableDemoLogin = async () => {
    try {
      await authSignIn("google", {
        callbackUrl: "/",
      });
    } catch {
      setSuccessMessage(c.messages.accessFailed);
      setTimeout(() => setSuccessMessage(""), 2600);
    }
  };

  const updateNickname = async (rawName: string, options?: { silent?: boolean }) => {
    if (profile.mode !== "member") {
      return false;
    }

    const nextName = rawName.trim().replace(/\s+/g, " ");

    if (nextName.length < 2 || nextName.length > 40) {
      if (!options?.silent) {
        setSuccessMessage(c.messages.nicknameLength);
        setTimeout(() => setSuccessMessage(""), 2600);
      }
      return false;
    }

    if (nextName === profile.name) {
      setNicknameDraft(nextName);
      return true;
    }

    setIsSavingNickname(true);

    try {
      const response = await fetch("/api/account/session", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ displayName: nextName }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        profile?: AuthProfilePayload;
        nextDisplayNameChangeAt?: string;
        errors?: string[];
      };

      if (!response.ok || !payload.ok || !payload.profile) {
        if (response.status === 429 && payload.nextDisplayNameChangeAt) {
          if (!options?.silent) {
            setSuccessMessage(
              c.messages.nicknameLimited(
                formatCalendarDate(payload.nextDisplayNameChangeAt, locale),
              ),
            );
            setTimeout(() => setSuccessMessage(""), 3200);
          }
          return false;
        }

        throw new Error(payload.errors?.[0] ?? "Nickname update failed");
      }

      const nextProfile = {
        ...mapAuthProfile(payload.profile),
        avatarUrl: payload.profile.avatarUrl ?? profile.avatarUrl ?? null,
      };
      setProfile(nextProfile);
      setNicknameDraft(nextProfile.name);
      setForm((current) => ({
        ...current,
        author: nextProfile.name,
      }));
      if (!options?.silent) {
        setSuccessMessage(c.messages.nicknameUpdated);
        setTimeout(() => setSuccessMessage(""), 2600);
      }
      return true;
    } catch {
      if (!options?.silent) {
        setSuccessMessage(c.messages.nicknameFailed);
        setTimeout(() => setSuccessMessage(""), 2600);
      }
      return false;
    } finally {
      setIsSavingNickname(false);
    }
  };

  const saveNickname = async () => {
    if (isSavingNickname) {
      return;
    }

    await updateNickname(nicknameDraft);
  };

  const signOut = async () => {
    try {
      await authSignOut({
        redirect: false,
      });
      await fetch("/api/account/session", {
        method: "DELETE",
      });
    } catch {
      // Local fallback still returns the UI to guest mode.
    }

    const guestProfile: Profile = {
      mode: "guest",
      name: c.common.defaultGuest,
    };

    setProfile(guestProfile);
    setProfileOwnedIds([]);
    setNicknameDraft(guestProfile.name);
    setForm((current) => ({
      ...current,
      author: guestProfile.name,
      password: "",
    }));
  };

  const openComposerFromHeader = () => {
    setIsComposerOpen(true);
  };

  const changeTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    applyDocumentTheme(nextTheme);

    if (hasHydrated) {
      persistStorage(STORAGE_KEYS.theme, nextTheme);
    }
  };

  const showPendingPosts = () => {
    if (pendingPosts.length === 0) {
      return;
    }

    setPosts((current) => mergePosts(pendingPosts, current));
    setPendingPosts([]);
    setSortReferenceTime(Date.now());
  };

  const nicknameHelpText =
    profile.mode === "member" && profile.nextDisplayNameChangeAt
      ? c.account.nicknameNextChange(
          formatCalendarDate(profile.nextDisplayNameChangeAt, locale),
        )
      : c.account.nicknameFirstHelp;

  return (
    <div className="min-h-screen pb-8 text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6 md:pt-6 lg:px-8">
        <header className="soft-rise sticky top-0 z-30 bg-[color-mix(in_srgb,var(--background)_78%,transparent)] py-3 backdrop-blur md:top-2 md:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="eyebrow text-[10px] text-[var(--muted)] md:text-[11px]">
                {c.common.brandEyebrow}
              </p>
              <Link href="/" className="display block truncate text-2xl leading-none tracking-[0.02em] sm:text-3xl">
                Dear, Today
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openComposerFromHeader}
                className="shrink-0 whitespace-nowrap rounded-full ink-fill px-4 py-2.5 text-sm font-medium  shadow-[0_12px_28px_rgba(45,36,31,0.12)] hover:translate-y-[-1px]"
              >
                {c.home.writeCta}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsProfileMenuOpen((current) => !current);
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-strong)] p-0 text-[var(--foreground)] shadow-[0_10px_24px_rgba(45,36,31,0.08)] ring-1 ring-[var(--line)]"
                  aria-label={c.profile.menuLabel}
                >
                  {profile.mode === "member" && profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <ProfileGlyph />
                  )}
                </button>

                {isProfileMenuOpen ? (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="absolute right-0 top-full z-50 mt-3 w-[min(calc(100vw-32px),_320px)] rounded-[26px] border border-[var(--line)] bg-[var(--surface-strong)] p-4 shadow-[0_24px_70px_rgba(45,36,31,0.16)]"
                  >
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {navItems.map((item) => {
                        const isActive = item.view === initialView;

                        return (
                          <Link
                            key={item.view}
                            href={item.href}
                            className={`rounded-full px-3 py-2 text-center text-xs ${
                              isActive
                                ? "ink-fill"
                                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-strong)]"
                            }`}
                          >
                            {c.nav[item.labelKey]}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ink-fill text-sm font-semibold ">
                        {profile.mode === "member" && profile.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.avatarUrl}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          profileBadgeLabel(profile, locale)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {profile.name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {profile.mode === "member"
                            ? c.profile.signedIn
                            : c.profile.signedOut}
                        </p>
                      </div>
                    </div>

                    {profile.mode === "member" ? (
                      <div className="mt-4">
                        <label className="text-xs font-medium text-[var(--muted)]">
                          {c.account.nicknameTitle}
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              value={nicknameDraft}
                              onChange={(event) => setNicknameDraft(event.target.value)}
                              className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                              placeholder={c.account.nicknamePlaceholder}
                            />
                            <button
                              type="button"
                              onClick={saveNickname}
                              disabled={isSavingNickname}
                              className="shrink-0 rounded-full ink-fill px-3 py-2 text-xs  disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {isSavingNickname ? c.account.saving : c.account.saveNickname}
                            </button>
                          </div>
                        </label>
                        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                          {nicknameHelpText}
                        </p>
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={signOut}
                            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)]"
                          >
                            {c.account.signOut}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={enableDemoLogin}
                        className="mt-4 w-full rounded-full ink-fill px-4 py-3 text-sm "
                      >
                        {c.common.continueGoogle}
                      </button>
                    )}

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <div className="grid grid-cols-2 gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-0.5">
                        {(["light", "evening"] as ThemeMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => changeTheme(mode)}
                            className={`rounded-full px-2.5 py-1 text-[11px] leading-none ${
                              theme === mode
                                ? "ink-fill"
                                : "text-[var(--muted)] hover:bg-[var(--surface-strong)]"
                            }`}
                          >
                            {mode === "light"
                              ? c.common.themeLight
                              : c.common.themeEvening}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setLocale(locale === "en" ? "ko" : "en")}
                        className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] leading-none text-[var(--muted)] hover:bg-[var(--surface-strong)]"
                        aria-label={locale === "en" ? "한국어로 보기" : "View in English"}
                      >
                        {locale === "en" ? "KO" : "EN"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 pt-2 md:pt-3">
          {isWrite ? (
            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="paper-panel rounded-[32px] px-6 py-6 sm:px-7">
                <p className="eyebrow text-[11px] text-[var(--sage)]">Writing lounge</p>
                <h2 className="mt-2 display text-4xl">Leave today a little softer</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  No title. No performance. Just one small note about what held you up.
                </p>

                <div className="mt-5 rounded-[26px] border border-[var(--line)] bg-white/72 p-4 sm:p-5">
                  <label className="text-sm text-[var(--muted)]" htmlFor="gratitude-body">
                    Gratitude note
                  </label>
                  <textarea
                    id="gratitude-body"
                    value={form.body}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, body: event.target.value }))
                    }
                    placeholder="I am grateful for..."
                    className="mt-3 min-h-56 w-full resize-none rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-4 text-base leading-7 outline-none placeholder:text-[#9a8b81] focus:border-[var(--accent)]"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>Keep it plain text. Line breaks are welcome.</span>
                    <span>{form.body.length}/{MAX_POST_LENGTH}</span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-[var(--muted)]">
                      Author name
                      <input
                        value={form.author}
                        onChange={(event) => {
                          const nextAuthor = event.target.value;
                          setForm((current) => ({
                            ...current,
                            author: nextAuthor,
                          }));
                          if (profile.mode === "member") {
                            setNicknameDraft(nextAuthor);
                          }
                        }}
                        className="mt-2 w-full rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                      />
                    </label>

                    <label className="text-sm text-[var(--muted)]">
                      {profile.mode === "member" ? "Visibility" : "Guest password"}
                      {profile.mode === "member" ? (
                        <div className="mt-2 inline-flex w-fit rounded-full bg-white/70 p-1">
                          {(["public", "hidden"] as const).map((visibility) => (
                            <button
                              key={visibility}
                              type="button"
                              onClick={() =>
                                setForm((current) => ({ ...current, visibility }))
                              }
                              className={`rounded-full px-3 py-2 text-sm ${
                                form.visibility === visibility
                                  ? "ink-fill"
                                  : "text-[var(--muted)] hover:bg-white"
                              }`}
                            >
                              {visibility === "public"
                                ? c.common.publicNote
                                : c.common.privateNote}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="password"
                          value={form.password}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                          placeholder="4+ characters for edit/delete"
                        />
                      )}
                    </label>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                    {profile.mode === "member"
                      ? c.home.visibilityHelpMember
                      : c.home.visibilityHelpGuest}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[var(--muted)]">
                      {profile.mode === "member"
                        ? `Posting as ${form.author.trim() || profile.name}. You can edit your notes from My Posts.`
                        : "Guest notes stay editable from the public card with your password."}
                    </p>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit || isSubmitting}
                      className="rounded-full ink-fill px-5 py-3 text-sm font-medium  disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isSubmitting ? "Adding..." : "Add to today's warmth"}
                    </button>
                  </div>

                  {successMessage ? (
                    <div className="mt-4 rounded-[22px] bg-[rgba(114,129,109,0.14)] px-4 py-3 text-sm text-[var(--sage)]">
                      <p>{successMessage}</p>
                      {lastCreatedId ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {canUsePersonalArchive ? (
                            <Link
                              href="/my-posts"
                              className="rounded-full bg-white/75 px-3 py-2 text-xs text-[var(--foreground)]"
                            >
                              View in My Posts
                            </Link>
                          ) : null}
                          <Link
                            href="/"
                            className="rounded-full bg-white/75 px-3 py-2 text-xs text-[var(--foreground)]"
                          >
                            Read the feed
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>

              <aside className="space-y-4">
                <section className="paper-panel rounded-[28px] p-5">
                  <p className="eyebrow text-[11px] text-[var(--accent)]">After you post</p>
                  <h3 className="mt-2 display text-3xl">Your note becomes part of today&apos;s warmth</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    It joins the public feed, can receive quiet hearts, and signed-in
                    notes also become part of your personal archive.
                  </p>
                </section>
                <section className="paper-panel rounded-[28px] p-5">
                  <p className="eyebrow text-[11px] text-[var(--sage)]">Need a softer start?</p>
                  <p className="display mt-2 text-3xl">{selectedPrompt}</p>
                </section>
              </aside>
            </section>
          ) : null}

          {isHome ? (
            <section>
              <div className="flex flex-col gap-3" id="latest-feed">
                <div className="flex justify-end">
                  <div className="flex items-center gap-2 rounded-full bg-white/40 p-1">
                    {(["latest", "today"] as const).map((sort) => (
                      <button
                        key={sort}
                        type="button"
                        onClick={() => setFeedSort(sort)}
                        className={`rounded-full px-4 py-2 text-xs ${
                          feedSort === sort
                            ? "ink-fill"
                            : "bg-white/76 text-[var(--muted)] hover:bg-white"
                        }`}
                      >
                        {sort === "latest" ? c.home.sortLatest : c.home.sortToday}
                      </button>
                    ))}
                  </div>
                </div>

                {pendingPosts.length > 0 ? (
                  <button
                    type="button"
                    onClick={showPendingPosts}
                    aria-live="polite"
                    className="feed-refresh-banner flex items-center justify-between gap-3 rounded-[22px] px-4 py-3 text-left text-sm"
                  >
                    <span>{c.home.newNotes(pendingPosts.length)}</span>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs">
                      {c.home.showNewNotes}
                    </span>
                  </button>
                ) : isCheckingFeed ? (
                  <p className="sr-only" aria-live="polite">
                    Checking for new gratitude notes.
                  </p>
                ) : null}

                <div className="grid card-grid gap-4">
                  {visiblePosts.map((post) => {
                    const expanded = expandedIds.includes(post.id);
                    const visibleBody = truncateText(post.body, expanded);

                    return (
                      <article
                        key={post.id}
                        className="paper-panel feed-enter flex min-h-[200px] flex-col rounded-[28px] p-5"
                      >
                        <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
                          <span>{post.author}</span>
                          <span>{formatRelative(post.createdAt, locale)}</span>
                        </div>
                        <p
                          className={`note-preview reading-text mt-4 whitespace-pre-line text-[15px] leading-8 text-[var(--foreground)] ${
                            expanded ? "note-preview-expanded" : ""
                          }`}
                        >
                          {visibleBody}
                        </p>
                        {post.body.length > POST_PREVIEW_LENGTH ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedIds((current) =>
                                expanded
                                  ? current.filter((id) => id !== post.id)
                                  : [...current, post.id],
                              )
                            }
                            className="mt-3 w-fit text-sm text-[var(--accent-strong)]"
                          >
                            {expanded ? c.home.showLess : c.home.readMore}
                          </button>
                        ) : null}

                        <div className="mt-auto flex items-center justify-between pt-6">
                          <button
                            type="button"
                            onClick={() => toggleHeart(post.id)}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                              heartedIds.includes(post.id)
                                ? "bg-[rgba(184,109,82,0.14)] text-[var(--accent-strong)]"
                                : "bg-white/85 text-[var(--muted)]"
                            }`}
                          >
                            <Heart filled={heartedIds.includes(post.id)} />
                            {post.hearts}
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setActionMenuId((current) =>
                                  current === post.id ? null : post.id,
                                );
                              }}
                              className="rounded-full px-3 py-2 text-lg leading-none text-[var(--muted)] hover:bg-white/80"
                              aria-label="Open note actions"
                            >
                              ⋯
                            </button>
                            {actionMenuId === post.id ? (
                              <div
                                onClick={(event) => event.stopPropagation()}
                                className="absolute bottom-full right-0 z-20 mb-2 min-w-28 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-2 text-sm shadow-[0_16px_44px_rgba(45,36,31,0.14)]"
                              >
                                <button
                                  type="button"
                                  onClick={() => startEdit(post)}
                                  className="block w-full rounded-xl px-3 py-2 text-left text-[var(--foreground)] hover:bg-[var(--surface)]"
                                >
                                  {c.common.edit}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteCandidate(post.id);
                                    setActionMenuId(null);
                                    setVerification("");
                                  }}
                                  className="block w-full rounded-xl px-3 py-2 text-left text-[var(--foreground)] hover:bg-[var(--surface)]"
                                >
                                  {c.common.delete}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {isMyPosts ? (
            <section>
              <p className="eyebrow text-[11px] text-[var(--accent)]">
                {c.myPosts.eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                {c.myPosts.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {canUsePersonalArchive
                  ? c.myPosts.bodyMember
                  : c.myPosts.bodyGuest}
              </p>

              {canUsePersonalArchive ? (
                <div className="mt-5 grid gap-3">
                  <div className="flex w-fit items-center gap-2 rounded-full bg-white/50 p-1">
                    {(["all", "public", "hidden"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setMyPostsFilter(filter)}
                        className={`rounded-full px-3 py-2 text-xs ${
                          myPostsFilter === filter
                            ? "ink-fill"
                            : "text-[var(--muted)] hover:bg-white"
                        }`}
                      >
                        {filter === "all"
                          ? c.myPosts.filterAll
                          : filter === "public"
                            ? c.myPosts.filterPublic
                            : c.myPosts.filterPrivate}
                      </button>
                    ))}
                  </div>
                  {archivedPosts.length > 0 ? (
                    archivedPosts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-[22px] border border-[var(--line)] bg-white/72 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm text-[var(--muted)]">{post.author}</p>
                            {(post.visibility ?? "public") === "hidden" ? (
                              <span className="rounded-full bg-[rgba(114,129,109,0.14)] px-2 py-1 text-[11px] text-[var(--sage)]">
                                {c.myPosts.privateBadge}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {formatRelative(post.createdAt, locale)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(post)}
                            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                          >
                            {c.common.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteCandidate(post.id);
                              setVerification("");
                            }}
                            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                          >
                            {c.common.delete}
                          </button>
                        </div>
                      </div>
                      <p className="reading-text mt-4 whitespace-pre-line text-sm leading-7">{post.body}</p>
                    </article>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/58 p-5 text-sm leading-7 text-[var(--muted)]">
                      {c.myPosts.emptyMember}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-[22px] border border-dashed border-[var(--line)] bg-white/58 p-5">
                  <p className="text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                    {c.myPosts.guestTitle}
                  </p>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
                    {c.myPosts.guestBody}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={enableDemoLogin}
                      className="rounded-full ink-fill px-4 py-2 text-sm "
                    >
                      {c.common.continueGoogle}
                    </button>
                    <button
                      type="button"
                      onClick={openComposerFromHeader}
                      className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                    >
                      {c.home.guestWrite}
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : null}

        </main>
      </div>

      {isComposerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-[rgba(45,36,31,0.34)] p-3 sm:items-center sm:justify-center">
          <div className="w-full max-w-xl rounded-[28px] bg-[var(--surface-strong)] p-5 shadow-[0_30px_80px_rgba(45,36,31,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <p className="eyebrow text-[11px] text-[var(--accent)]">
                {c.home.quickNote}
              </p>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)]"
              >
                {c.common.cancel}
              </button>
            </div>

            <div className="mt-4">
              <textarea
                value={form.body}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    body: event.target.value,
                  }))
                }
                placeholder={c.home.notePlaceholder}
                className="reading-text min-h-40 w-full resize-none rounded-[20px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm leading-7 outline-none placeholder:text-[#9a8b81] focus:border-[var(--accent)]"
              />
              <div className="mt-3 grid gap-2">
                <input
                  aria-label="Author name"
                  value={form.author}
                  onChange={(event) => {
                    const nextAuthor = event.target.value;
                    setForm((current) => ({
                      ...current,
                      author: nextAuthor,
                    }));
                    if (profile.mode === "member") {
                      setNicknameDraft(nextAuthor);
                    }
                  }}
                  className="w-full rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  placeholder={c.home.authorPlaceholder}
                />
                {profile.mode === "guest" ? (
                  <input
                    aria-label="Guest password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="w-full rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    placeholder={c.home.passwordPlaceholder}
                  />
                ) : (
                  <div className="inline-flex w-fit rounded-full bg-white/70 p-1">
                    {(["public", "hidden"] as const).map((visibility) => (
                      <button
                        key={visibility}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({ ...current, visibility }))
                        }
                        className={`rounded-full px-3 py-2 text-sm ${
                          form.visibility === visibility
                            ? "ink-fill"
                            : "text-[var(--muted)] hover:bg-white"
                        }`}
                      >
                        {visibility === "public"
                          ? c.common.publicNote
                          : c.common.privateNote}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                {profile.mode === "member"
                  ? c.home.visibilityHelpMember
                  : c.home.visibilityHelpGuest}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--muted)]">
                  {form.body.length}/{MAX_POST_LENGTH}
                </span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="rounded-full ink-fill px-4 py-2 text-sm  disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isSubmitting ? c.home.adding : c.home.addNote}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {(editingId || deleteCandidate) && (
        <div className="fixed inset-0 z-50 flex items-end bg-[rgba(45,36,31,0.34)] p-3 sm:items-center sm:justify-center">
          <div className="w-full max-w-xl rounded-[28px] bg-[var(--surface-strong)] p-5 shadow-[0_30px_80px_rgba(45,36,31,0.18)]">
            <p className="eyebrow text-[11px] text-[var(--accent)]">
              {editingId ? c.modal.editEyebrow : c.modal.deleteEyebrow}
            </p>
            <h3 className="mt-2 display text-3xl">
              {editingId ? c.modal.editTitle : c.modal.deleteTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {editingId
                ? c.modal.editBody
                : c.modal.deleteBody}
            </p>

            {editingId ? (
              <textarea
                value={editingDraft}
                onChange={(event) => setEditingDraft(event.target.value)}
                className="mt-5 min-h-40 w-full rounded-[22px] border border-[var(--line)] bg-white px-4 py-4 text-sm leading-7 outline-none focus:border-[var(--accent)]"
              />
            ) : null}

            {(() => {
              const candidateId = editingId ?? deleteCandidate;
              const candidate = posts.find((post) => post.id === candidateId);

              return candidate && requiresGuestVerification(candidate) ? (
                <label className="mt-4 block text-sm text-[var(--muted)]">
                  {c.common.guestPassword}
                  <input
                    type="password"
                    value={verification}
                    onChange={(event) => {
                      setVerification(event.target.value);
                      setVerificationError(false);
                    }}
                    className={`mt-2 w-full rounded-full border bg-white px-4 py-3 outline-none focus:border-[var(--accent)] ${
                      verificationError
                        ? "shake border-[var(--accent)] shadow-[0_0_0_4px_rgba(184,109,82,0.12)]"
                        : "border-[var(--line)]"
                    }`}
                    aria-invalid={verificationError}
                    placeholder={c.modal.passwordPlaceholder}
                  />
                </label>
              ) : null;
            })()}

            {successMessage && (editingId || deleteCandidate) ? (
              <p
                className="mt-4 rounded-[18px] bg-[rgba(184,109,82,0.12)] px-3 py-2 text-sm text-[var(--accent-strong)]"
                role={verificationError ? "alert" : "status"}
                aria-live="polite"
              >
                {successMessage}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDeleteCandidate(null);
                  setActionMenuId(null);
                  setVerification("");
                  setVerificationError(false);
                }}
                className="rounded-full border border-[var(--line)] px-4 py-3 text-sm"
              >
                {c.common.cancel}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={saveEdit}
                  className={`rounded-full ink-fill px-4 py-3 text-sm  ${
                    verificationError ? "shake" : ""
                  }`}
                >
                  {c.common.saveChanges}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={confirmDelete}
                  className={`rounded-full ink-fill px-4 py-3 text-sm  ${
                    verificationError ? "shake" : ""
                  }`}
                >
                  {c.common.deleteNote}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M12 20.4 4.85 13.5a4.74 4.74 0 0 1 0-6.84 4.94 4.94 0 0 1 6.95 0L12 6.86l.2-.2a4.94 4.94 0 0 1 6.95 0 4.74 4.74 0 0 1 0 6.84Z" />
    </svg>
  );
}
