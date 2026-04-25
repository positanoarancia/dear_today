"use client";

import Link from "next/link";
import { signIn as authSignIn, signOut as authSignOut } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_AUTHOR_LENGTH,
  MAX_POST_LENGTH,
  MIN_AUTHOR_LENGTH,
  defaultProfile,
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

type Locale = "en" | "ko";
type FeedSort = "latest" | "today";
type MyPostsFilter = "all" | "public" | "hidden";
type ThemeMode = "light" | "evening";

const FEED_PAGE_SIZE = 24;
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const configuredNoticeText =
  process.env.NEXT_PUBLIC_DEAR_TODAY_NOTICE_TEXT?.trim() ?? "";
const configuredNoticeUrl =
  process.env.NEXT_PUBLIC_DEAR_TODAY_NOTICE_URL?.trim() ?? "";

const dailyNoticePrompts = {
  en: [
    "What was the most grateful moment of your day?",
    "What made you smile a little today?",
    "What felt most fortunate today?",
    "Was there someone you felt thankful for today?",
    "What made the day a little less heavy?",
    "Was there a meal you felt grateful for today?",
    "What can you thank your body for today?",
    "When did today feel better than expected?",
    "Was there a moment when your mind settled?",
    "What felt more grateful after the day passed?",
    "What waited for you today?",
    "Was there anything kind in today's weather?",
    "What words stayed with you today?",
    "Did someone show you a small kindness today?",
    "When did you feel thankful to yourself today?",
    "What is one thing that passed safely today?",
    "What was the least bad part of the day?",
    "What still feels fortunate when you look back?",
    "What felt best when you came home?",
    "What helped you get through the day?",
    "Was there a small good accident today?",
    "What felt comfortable because it was not uncomfortable?",
    "What kindness did you receive today?",
    "Who would you like to thank today?",
    "When did the day feel quietly comfortable?",
    "What reassured you today?",
    "What ordinary thing deserves thanks today?",
    "What are you grateful is over today?",
    "What scene would you like to remember?",
    "If you choose just one thing, what are you thankful for?",
    "Even an ordinary day leaves a small gratitude behind.",
    "Even if today was not good, getting through it can be enough.",
    "A short note is enough today.",
    "If nothing comes to mind, start with what passed safely.",
    "Gratitude does not need to be grand.",
    "You do not have to fill all five. One is a beginning.",
    "On tired days, gratitude can be smaller.",
    "When your mind is crowded, begin with something simple.",
    "You are allowed to write gratitude even on a hard day.",
    "The sentence does not have to be perfect.",
    "A hard day can still have a less hard moment.",
    "It is okay if gratitude does not arrive right away.",
    "Some days make gratitude hard to find.",
    "Sometimes writing reveals what was grateful.",
    "Something too small to notice can become today's gratitude.",
    "A plain day is still worth recording.",
    "You can write gratitude while not feeling great.",
    "The smaller the gratitude, the more honest it can be.",
    "Choose one from a person, a meal, a place, your body, or chance.",
    "If five things feel hard, write one in a little more detail.",
    "Try starting with, 'I was relieved that...'",
    "Begin with the smallest thankfulness that comes to mind.",
    "Find one grateful thing in something you ate today.",
    "Think of one sentence someone said to you.",
    "Write down one thing your body carried today.",
    "Slowly remember the moment you came home.",
    "Find one small difference inside your repeated routine.",
    "If gratitude feels hard, write what was not uncomfortable.",
    "Picture one grateful scene like a photo.",
    "One sentence is enough. Leave it here now.",
  ],
  ko: [
    "오늘 가장 고마웠던 순간은 언제였나요?",
    "오늘 나를 조금 웃게 한 건 뭐였나요?",
    "오늘 하루 중 제일 다행이었던 일은 무엇이었나요?",
    "오늘 누군가에게 고마웠던 일이 있었나요?",
    "오늘 나를 덜 힘들게 해준 것은 무엇이었나요?",
    "오늘 먹은 것 중 고마웠던 한 끼가 있었나요?",
    "오늘 내 몸에게 고맙다고 말할 일이 있었나요?",
    "오늘 예상보다 괜찮았던 순간은 언제였나요?",
    "오늘 마음이 잠깐 놓였던 장면이 있었나요?",
    "오늘 지나고 보니 감사했던 일은 무엇인가요?",
    "오늘 나를 기다려준 것은 무엇이었나요?",
    "오늘의 날씨에서 고마운 점이 있었나요?",
    "오늘 들은 말 중에 마음에 남은 것이 있었나요?",
    "오늘 누군가의 작은 배려를 받았나요?",
    "오늘 내가 나에게 고마웠던 순간은 언제였나요?",
    "오늘 무사히 지나간 일 하나를 적어볼까요?",
    "오늘 덜 나빴던 순간은 무엇이었나요?",
    "오늘 다시 생각해도 다행인 일은 무엇인가요?",
    "오늘 집에 돌아와 가장 좋았던 건 뭐였나요?",
    "오늘 하루를 버티게 해준 것은 무엇이었나요?",
    "오늘 우연히 좋았던 일이 있었나요?",
    "오늘 불편하지 않아서 고마웠던 것은 무엇인가요?",
    "오늘 내가 받은 친절 하나가 있었나요?",
    "오늘 감사하다고 말하고 싶은 사람이 있나요?",
    "오늘 작지만 편했던 순간은 언제였나요?",
    "오늘 나를 안심시킨 것은 무엇이었나요?",
    "오늘 당연하게 지나쳤지만 감사한 것은 무엇인가요?",
    "오늘 끝나서 고마운 일이 있었나요?",
    "오늘 계속 기억하고 싶은 장면이 있었나요?",
    "오늘 하루에서 하나만 고른다면 무엇에 감사한가요?",
    "별일 없는 하루에도 감사할 건 작게 남아 있어요.",
    "좋은 하루가 아니었어도, 버틴 것만으로 적을 수 있어요.",
    "오늘은 짧게 써도 충분해요.",
    "아무것도 떠오르지 않는 날엔, 무사히 지나온 것부터 적어도 돼요.",
    "감사는 거창하지 않아도 괜찮아요.",
    "다섯 가지를 다 못 채워도 괜찮아요. 하나면 시작이에요.",
    "피곤한 날의 감사는 더 작아도 괜찮아요.",
    "마음이 복잡한 날엔 단순한 것부터 적어봐요.",
    "오늘을 잘 보내지 못했어도 감사할 자격은 있어요.",
    "완벽한 문장이 아니어도 괜찮아요.",
    "힘든 하루에도 덜 힘들었던 순간은 있을 수 있어요.",
    "감사한 마음이 바로 느껴지지 않아도 괜찮아요.",
    "오늘은 고마운 걸 찾기 어려운 날일 수도 있어요.",
    "적고 나서야 고마웠다는 걸 알게 되는 일도 있어요.",
    "사소해서 지나친 일이 오늘의 감사가 될 수 있어요.",
    "무난히 지나간 하루도 충분히 기록할 만해요.",
    "기분이 좋지 않아도 감사일기를 쓸 수 있어요.",
    "오늘의 감사가 작을수록 더 솔직할 때가 있어요.",
    "오늘은 사람, 음식, 장소, 몸, 우연 중 하나를 골라 적어봐요.",
    "감사 다섯 가지가 어렵다면, 하나를 조금 자세히 적어도 좋아요.",
    "오늘은 “다행이었다”로 시작해보세요.",
    "지금 떠오르는 가장 사소한 고마움부터 적어봐요.",
    "오늘 먹은 것 하나에서 감사한 점을 찾아봐요.",
    "누군가의 말 한마디를 떠올려보세요.",
    "오늘 내 몸이 해낸 일을 하나 적어주세요.",
    "집에 돌아온 순간을 천천히 떠올려보세요.",
    "오늘 반복된 일상 안에서 달랐던 작은 점을 찾아봐요.",
    "감사한 일을 쓰기 어렵다면, 불편하지 않았던 일을 적어도 좋아요.",
    "오늘 고마웠던 장면을 사진처럼 떠올려보세요.",
    "한 문장만 써도 괜찮으니 지금 바로 남겨봐요.",
  ],
} satisfies Record<Locale, string[]>;

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
      notice: "A small note: Dear, Today is being shaped quietly, one gratitude at a time.",
      continueEdit: "Continue to edit",
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
      notePlaceholder: "One small gratitude per line.",
      noteHint: "Try one small gratitude per line. Three is enough.",
      authorPlaceholder: "Name to show",
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
      editBodyGuest:
        "Guest notes require the password you used when writing. Logged-in posts can be updated directly.",
      editBodyMember:
        "Refine the wording or change the visibility whenever you need.",
      deleteBodyGuest:
        "Deleted notes cannot be restored. Guest notes require password verification first.",
      deleteBodyMember: "Deleted notes cannot be restored.",
      passwordPlaceholder: "Password for this note",
    },
    messages: {
      posted: "Your gratitude is now part of today's warmth.",
      guestPasswordFirst: "Please enter the password you set when writing this note.",
      passwordMismatch: "That password is not right. Check the password you used for this note.",
      verifyFailed: "This note could not be changed. Use the password set when it was written.",
      databaseFailed: "We could not reach the database. Please try again.",
      guestRateLimited:
        "Guest notes are being written too quickly. Please wait a little before writing again.",
      accessFailed: "We could not start account access yet. Please try again.",
      nicknameLength: "Choose a nickname between 2 and 20 characters.",
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
      notice: "작은 공지: Dear, Today는 감사 한 줄씩 천천히 다듬어가는 중입니다.",
      continueEdit: "수정하기",
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
      notePlaceholder: "오늘 고마웠던 일을 한 줄씩 적어보세요.",
      noteHint: "한 줄에 하나씩 적어도 좋아요. 세 가지면 충분합니다.",
      authorPlaceholder: "이름을 적어주세요",
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
      editBodyGuest:
        "게스트 글은 작성할 때 사용한 비밀번호가 필요합니다. 로그인 글은 바로 수정할 수 있습니다.",
      editBodyMember:
        "내용을 다듬거나 공개 범위를 바꿀 수 있습니다.",
      deleteBodyGuest:
        "삭제한 글은 되돌릴 수 없습니다. 게스트 글은 먼저 비밀번호를 확인합니다.",
      deleteBodyMember: "삭제한 글은 되돌릴 수 없습니다.",
      passwordPlaceholder: "이 글의 비밀번호",
    },
    messages: {
      posted: "당신의 감사가 오늘의 온기에 더해졌습니다.",
      guestPasswordFirst: "이 글을 쓸 때 정한 비밀번호를 입력해주세요.",
      passwordMismatch: "비밀번호가 맞지 않아요. 이 글을 쓸 때 정한 비밀번호를 확인해주세요.",
      verifyFailed: "이 글을 변경할 수 없어요. 작성할 때 정한 비밀번호로 다시 시도해주세요.",
      databaseFailed: "데이터베이스에 연결하지 못했습니다. 다시 시도해주세요.",
      guestRateLimited:
        "게스트 글이 너무 빠르게 작성되고 있어요. 잠시 후 다시 남겨주세요.",
      accessFailed: "계정 접근을 시작하지 못했습니다. 다시 시도해주세요.",
      nicknameLength: "별명은 2자 이상 20자 이하로 입력해주세요.",
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

type EntriesPayload = {
  ok: boolean;
  entries?: ApiEntry[];
  nextCursor?: string | null;
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

function persistLocalePreference(locale: Locale) {
  persistStorage(STORAGE_KEYS.locale, locale);

  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${STORAGE_KEYS.locale}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function persistThemePreference(theme: ThemeMode) {
  persistStorage(STORAGE_KEYS.theme, theme);

  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${STORAGE_KEYS.theme}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
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

function formatFeedDateDivider(iso: string, locale: Locale, referenceTime: number) {
  const date = new Date(iso);
  const reference = referenceTime > 0 ? new Date(referenceTime) : new Date(iso);
  const dateKey = getLocalDateKey(date);
  const todayKey = getLocalDateKey(reference);
  const yesterday = new Date(reference);
  yesterday.setDate(reference.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  if (dateKey === todayKey) {
    return locale === "ko" ? "오늘" : "Today";
  }

  if (dateKey === yesterdayKey) {
    return locale === "ko" ? "어제" : "Yesterday";
  }

  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDailyNoticePrompt(locale: Locale, dateKey: string) {
  const prompts = dailyNoticePrompts[locale];
  const seed = [...dateKey].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return prompts[seed % prompts.length];
}

function splitNoteParagraphs(body: string) {
  return body
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function renderNoteParagraphs(body: string) {
  const paragraphs = splitNoteParagraphs(body);

  return paragraphs.length > 0
    ? paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>{paragraph}</p>
      ))
    : null;
}

function getFeedCardSizeClass(body: string) {
  const paragraphCount = splitNoteParagraphs(body).length;

  if (body.length > 260 || paragraphCount >= 4) {
    return "min-h-[250px]";
  }

  if (body.length > 130 || paragraphCount >= 2) {
    return "min-h-[235px]";
  }

  return "min-h-[225px]";
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

export function DearTodayApp({
  initialView,
  initialLocale = "ko",
  initialTheme = "light",
  initialNoticeDateKey = null,
}: {
  initialView: View;
  initialLocale?: Locale;
  initialTheme?: ThemeMode;
  initialNoticeDateKey?: string | null;
}) {
  const isHome = initialView === "home";
  const isWrite = initialView === "write";
  const isMyPosts = initialView === "my-posts";
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [heartedIds, setHeartedIds] = useState<string[]>([]);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [profileOwnedIds, setProfileOwnedIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>({
    ...initialForm,
  });
  const [selectedPromptIndex] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [collapsibleIds, setCollapsibleIds] = useState<string[]>([]);
  const [heartPopIds, setHeartPopIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [editingVisibility, setEditingVisibility] =
    useState<FormState["visibility"]>("public");
  const [isEditingUnlocked, setIsEditingUnlocked] = useState(false);
  const [isUnlockingEdit, setIsUnlockingEdit] = useState(false);
  const [verification, setVerification] = useState("");
  const [verificationError, setVerificationError] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(defaultProfile.name);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [nicknameFeedback, setNicknameFeedback] = useState("");
  const [nicknameError, setNicknameError] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [feedSort, setFeedSort] = useState<FeedSort>("latest");
  const [myPostsFilter, setMyPostsFilter] = useState<MyPostsFilter>("all");
  const [sortReferenceTime, setSortReferenceTime] = useState(0);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [isCheckingFeed, setIsCheckingFeed] = useState(false);
  const [feedNextCursor, setFeedNextCursor] = useState<string | null>(null);
  const [hasMoreFeed, setHasMoreFeed] = useState(false);
  const [isLoadingMoreFeed, setIsLoadingMoreFeed] = useState(false);
  const [dailyNoticeDateKey, setDailyNoticeDateKey] = useState<string | null>(
    initialNoticeDateKey,
  );
  const postsRef = useRef(posts);
  const ownedIdsRef = useRef(ownedIds);
  const notePreviewRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const feedLoadMoreRef = useRef<HTMLDivElement | null>(null);
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
    ownedIdsRef.current = ownedIds;
  }, [ownedIds]);

  useEffect(() => {
    const hydrationUpdate = window.setTimeout(() => {
      setDailyNoticeDateKey(getLocalDateKey(new Date()));
    }, 0);

    const interval = window.setInterval(() => {
      setDailyNoticeDateKey(getLocalDateKey(new Date()));
    }, 60 * 1000);

    return () => {
      window.clearTimeout(hydrationUpdate);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateHeaderMode = () => {
      setIsHeaderCompact(window.scrollY > 24);
    };

    updateHeaderMode();
    window.addEventListener("scroll", updateHeaderMode, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeaderMode);
    };
  }, []);

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const nextDeviceId = getOrCreateDeviceId();
      const nextLocale = initialLocale;
      const storedTheme = readStorage<ThemeMode | null>(STORAGE_KEYS.theme, null);
      const systemTheme: ThemeMode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "evening"
        : "light";
      const documentTheme = document.documentElement.dataset.theme;
      const nextTheme =
        storedTheme ??
        (documentTheme === "evening" || documentTheme === "light"
          ? documentTheme
          : systemTheme);
      const storedPosts = readStorage<Post[]>(STORAGE_KEYS.posts, []);
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
        author:
          localizedGuestProfile.mode === "member" ? localizedGuestProfile.name : "",
      }));
      setNicknameDraft(localizedGuestProfile.name);
    }, 0);

    return () => {
      window.clearTimeout(hydrate);
    };
  }, [initialLocale]);

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

    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistLocalePreference(locale);
    document.documentElement.lang = locale === "ko" ? "ko" : "en";
  }, [hasHydrated, locale]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistThemePreference(theme);
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
          `/api/entries?actorKey=${encodeURIComponent(
            reactionActorKey,
          )}&limit=${FEED_PAGE_SIZE}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setApiStatus("fallback");
          return;
        }

        const payload = (await response.json()) as EntriesPayload;

        if (!payload.ok || !payload.entries) {
          setApiStatus("fallback");
          return;
        }

        const latestEntries = payload.entries;
        setFeedNextCursor(payload.nextCursor ?? null);
        setHasMoreFeed(Boolean(payload.nextCursor));
        const latestPosts = latestEntries.map(mapApiEntryToPost);
        let ownedEntries: ApiEntry[] = [];
        const missingOwnedIds = ownedIdsRef.current.filter(
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
  }, [deviceId, hasHydrated, reactionActorKey]);

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
          `/api/entries?actorKey=${encodeURIComponent(
            reactionActorKey,
          )}&limit=${FEED_PAGE_SIZE}`,
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as EntriesPayload;

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
    if (
      !deviceId ||
      !feedNextCursor ||
      !hasHydrated ||
      !hasMoreFeed ||
      !isHome ||
      isLoadingMoreFeed
    ) {
      return;
    }

    const target = feedLoadMoreRef.current;
    if (!target) {
      return;
    }

    const cursor = feedNextCursor;
    let ignore = false;

    async function loadMoreEntries() {
      setIsLoadingMoreFeed(true);

      try {
        const response = await fetch(
          `/api/entries?actorKey=${encodeURIComponent(
            reactionActorKey,
          )}&limit=${FEED_PAGE_SIZE}&cursor=${encodeURIComponent(cursor)}`,
        );

        if (!response.ok || ignore) {
          return;
        }

        const payload = (await response.json()) as EntriesPayload;

        if (!payload.ok || !payload.entries || ignore) {
          return;
        }

        const nextPosts = payload.entries.map(mapApiEntryToPost);
        setPosts((current) => mergePosts(current, nextPosts));
        setFeedNextCursor(payload.nextCursor ?? null);
        setHasMoreFeed(Boolean(payload.nextCursor));

        const apiEntryIds = payload.entries.map((entry) => entry.id);
        const apiHeartedIds = payload.entries
          .filter((entry) => entry.viewerHasHearted)
          .map((entry) => entry.id);
        setHeartedIds((current) =>
          mergeUniqueStable(
            current.filter((id) => !apiEntryIds.includes(id)),
            apiHeartedIds,
          ),
        );

        const editableIds = payload.entries
          .filter((entry) => entry.canEdit)
          .map((entry) => entry.id);
        setOwnedIds((current) => mergeUniqueStable(current, editableIds));
        setProfileOwnedIds((current) => mergeUniqueStable(current, editableIds));
      } catch {
        // Infinite loading should stay quiet; the current feed remains readable.
      } finally {
        if (!ignore) {
          setIsLoadingMoreFeed(false);
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMoreEntries();
        }
      },
      {
        rootMargin: "480px 0px",
      },
    );

    observer.observe(target);

    return () => {
      ignore = true;
      observer.disconnect();
    };
  }, [
    deviceId,
    feedNextCursor,
    hasHydrated,
    hasMoreFeed,
    isHome,
    isLoadingMoreFeed,
    reactionActorKey,
  ]);

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

    persistStorage(
      STORAGE_KEYS.posts,
      posts.filter(
        (post) =>
          !profileOwnedIds.includes(post.id) &&
          (post.visibility ?? "public") !== "hidden",
      ),
    );
  }, [hasHydrated, posts, profileOwnedIds]);

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
  const visiblePostGroups = useMemo(() => {
    return visiblePosts.reduce<Array<{ key: string; label: string; posts: Post[] }>>(
      (groups, post) => {
        const key = getLocalDateKey(new Date(post.createdAt));
        const currentGroup = groups.at(-1);

        if (currentGroup?.key === key) {
          currentGroup.posts.push(post);
          return groups;
        }

        groups.push({
          key,
          label: formatFeedDateDivider(post.createdAt, locale, sortReferenceTime),
          posts: [post],
        });

        return groups;
      },
      [],
    );
  }, [locale, sortReferenceTime, visiblePosts]);
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

  useEffect(() => {
    if (!isHome) {
      return;
    }

    let frame = 0;

    const measureNoteOverflow = () => {
      frame = window.requestAnimationFrame(() => {
        const nextIds = visiblePosts
          .filter((post) => {
            const preview = notePreviewRefs.current[post.id];

            if (!preview) {
              return false;
            }

            return preview.scrollHeight > preview.clientHeight + 2;
          })
          .map((post) => post.id);

        setCollapsibleIds((current) => {
          if (
            current.length === nextIds.length &&
            current.every((id, index) => id === nextIds[index])
          ) {
            return current;
          }

          return nextIds;
        });
      });
    };

    measureNoteOverflow();
    window.addEventListener("resize", measureNoteOverflow);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureNoteOverflow);
    };
  }, [expandedIds, isHome, visiblePosts]);

  const canSubmit =
    form.body.trim().length >= 12 &&
    form.body.length <= MAX_POST_LENGTH &&
    (profile.mode === "member" ||
      form.author.trim().length === 0 ||
      (form.author.trim().length >= MIN_AUTHOR_LENGTH &&
        form.author.trim().length <= MAX_AUTHOR_LENGTH)) &&
    (profile.mode === "member" || form.password.trim().length >= 4);

  const toggleHeart = async (postId: string) => {
    const alreadyHearted = heartedIds.includes(postId);

    if (!alreadyHearted) {
      setHeartPopIds((current) =>
        current.includes(postId) ? current : [...current, postId],
      );
      window.setTimeout(() => {
        setHeartPopIds((current) => current.filter((id) => id !== postId));
      }, 560);
    }

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
    const guestAuthorName = form.author.trim() || c.common.defaultGuest;
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
                  authorName: profile.name,
                }
              : {
                  kind: "guest",
                  authorName: guestAuthorName,
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
      } else if (response.status === 429) {
        setIsSubmitting(false);
        setSuccessMessage(c.messages.guestRateLimited);
        setTimeout(() => setSuccessMessage(""), 2600);
        return;
      } else if (response.status >= 400 && response.status < 500) {
        setIsSubmitting(false);
        setSuccessMessage(payload.errors?.[0] ?? c.messages.databaseFailed);
        setTimeout(() => setSuccessMessage(""), 2600);
        return;
      } else {
        setApiStatus("fallback");
      }
    } catch {
      setApiStatus("fallback");
    }

    const newPost: Post = {
      id: entryId,
      author: profile.mode === "member" ? profile.name : guestAuthorName,
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
    }
    setForm({
      body: "",
      author: profile.mode === "member" ? profile.name : "",
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
    setEditingVisibility(post.visibility ?? "public");
    setIsEditingUnlocked(!requiresGuestVerification(post));
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

  const unlockEdit = async () => {
    if (!editingId || isUnlockingEdit) {
      return;
    }

    const post = posts.find((item) => item.id === editingId);
    if (!post) {
      return;
    }

    if (!requiresGuestVerification(post)) {
      setIsEditingUnlocked(true);
      setSuccessMessage("");
      return;
    }

    if (verification.trim().length < 4) {
      showVerificationError(c.messages.guestPasswordFirst);
      return;
    }

    if (post.guestPassword && verification.trim() !== post.guestPassword) {
      showVerificationError(c.messages.passwordMismatch);
      return;
    }

    if (isDatabaseEntryId(editingId)) {
      setIsUnlockingEdit(true);

      try {
        const response = await fetch(`/api/entries/${editingId}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            actor: {
              kind: "guest",
              password: verification,
            },
          }),
        });

        if (!response.ok) {
          showVerificationError(c.messages.passwordMismatch);
          return;
        }
      } catch {
        setSuccessMessage(c.messages.databaseFailed);
        setTimeout(() => setSuccessMessage(""), 2600);
        return;
      } finally {
        setIsUnlockingEdit(false);
      }
    }

    setIsEditingUnlocked(true);
    setSuccessMessage("");
    setVerificationError(false);
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
    if (needsPassword && !isEditingUnlocked) {
      showVerificationError(c.messages.guestPasswordFirst);
      return;
    }

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
            ...(isProfileDatabaseOwner ? { visibility: editingVisibility } : {}),
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
        item.id === editingId
          ? {
              ...item,
              body: editingDraft.trim(),
              ...(profile.mode === "member" && profileOwnedIds.includes(item.id)
                ? { visibility: editingVisibility }
                : {}),
            }
          : item,
      ),
    );
    setEditingId(null);
    setEditingDraft("");
    setIsEditingUnlocked(false);
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

    if (
      nextName.length < MIN_AUTHOR_LENGTH ||
      nextName.length > MAX_AUTHOR_LENGTH
    ) {
      if (!options?.silent) {
        showNicknameFeedback(c.messages.nicknameLength, true);
      }
      return false;
    }

    if (nextName === profile.name) {
      setNicknameDraft(nextName);
      if (!options?.silent && profile.nextDisplayNameChangeAt) {
        showNicknameFeedback(
          c.messages.nicknameLimited(
            formatCalendarDate(profile.nextDisplayNameChangeAt, locale),
          ),
          true,
        );
      }
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
            showNicknameFeedback(
              c.messages.nicknameLimited(
                formatCalendarDate(payload.nextDisplayNameChangeAt, locale),
              ),
              true,
            );
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
        showNicknameFeedback(c.messages.nicknameUpdated, false);
      }
      return true;
    } catch {
      if (!options?.silent) {
        showNicknameFeedback(c.messages.nicknameFailed, true);
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

  const showNicknameFeedback = (message: string, isError: boolean) => {
    setNicknameFeedback(message);
    setNicknameError(false);
    if (isError) {
      window.requestAnimationFrame(() => setNicknameError(true));
    }
    setTimeout(() => {
      setNicknameFeedback("");
      setNicknameError(false);
    }, isError ? 3400 : 2400);
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
    setPosts((current) =>
      current.filter((post) => !profileOwnedIds.includes(post.id)),
    );
    setProfileOwnedIds([]);
    setNicknameDraft(guestProfile.name);
    setForm((current) => ({
      ...current,
      author: "",
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
      persistThemePreference(nextTheme);
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
  const normalizedNicknameDraft = nicknameDraft.trim().replace(/\s+/g, " ");
  const nicknameChangeLocked =
    profile.mode === "member" &&
    profile.nextDisplayNameChangeAt !== null;
  const canSaveNickname =
    profile.mode === "member" &&
    !isSavingNickname &&
    !nicknameChangeLocked &&
    normalizedNicknameDraft !== profile.name &&
    normalizedNicknameDraft.length >= MIN_AUTHOR_LENGTH &&
    normalizedNicknameDraft.length <= MAX_AUTHOR_LENGTH;
  const editingPost = editingId
    ? (posts.find((post) => post.id === editingId) ?? null)
    : null;
  const deletePost = deleteCandidate
    ? (posts.find((post) => post.id === deleteCandidate) ?? null)
    : null;
  const modalPost = editingPost ?? deletePost;
  const modalNeedsGuestVerification =
    modalPost !== null && requiresGuestVerification(modalPost);
  const canEditVisibility =
    profile.mode === "member" &&
    editingPost !== null &&
    profileOwnedIds.includes(editingPost.id);
  const editingNeedsPassword =
    editingPost !== null && requiresGuestVerification(editingPost);
  const shouldShowEditPasswordFirst =
    editingId !== null && editingNeedsPassword && !isEditingUnlocked;
  const modalBodyText = editingId
    ? modalNeedsGuestVerification
      ? c.modal.editBodyGuest
      : c.modal.editBodyMember
    : modalNeedsGuestVerification
      ? c.modal.deleteBodyGuest
      : c.modal.deleteBodyMember;
  const operatorNoticeText =
    configuredNoticeText ||
    (dailyNoticeDateKey ? getDailyNoticePrompt(locale, dailyNoticeDateKey) : "");

  return (
    <div className="min-h-screen pb-8 text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pb-10 pt-0 sm:px-6 lg:px-8">
        <header
          className={`app-header soft-rise sticky top-0 z-30 -mx-4 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${
            isHeaderCompact
              ? "app-header-compact pb-2 pt-[calc(env(safe-area-inset-top)+0.45rem)] md:pb-3 md:pt-3"
              : "pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:pb-4 md:pt-4"
          }`}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <p
                className={`eyebrow overflow-hidden text-[10px] text-[var(--muted)] transition-all duration-200 md:text-[11px] ${
                  isHeaderCompact
                    ? "max-h-0 translate-y-[-4px] opacity-0"
                    : "max-h-5 translate-y-0 opacity-100"
                }`}
              >
                {c.common.brandEyebrow}
              </p>
              <Link
                href="/"
                className={`display block truncate leading-none tracking-[0.02em] transition-[font-size,color] duration-200 ${
                  isHeaderCompact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
                }`}
              >
                Dear, Today
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openComposerFromHeader}
                className={`shrink-0 whitespace-nowrap rounded-full ink-fill text-sm font-medium shadow-[0_12px_28px_rgba(45,36,31,0.12)] hover:translate-y-[-1px] ${
                  isHeaderCompact ? "px-3.5 py-2" : "px-4 py-2.5"
                }`}
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
                  className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-strong)] p-0 text-[var(--foreground)] shadow-[0_10px_24px_rgba(45,36,31,0.08)] ring-1 ring-[var(--line)] ${
                    isHeaderCompact ? "h-9 w-9" : "h-10 w-10"
                  }`}
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
                        <label className="sr-only" htmlFor="profile-nickname">
                          {c.account.nicknameTitle}
                        </label>
                        <div
                          className={`flex items-center gap-2 border-b pb-2 ${
                            nicknameError
                              ? "shake border-[var(--accent)]"
                              : "border-[var(--line)]"
                          }`}
                        >
                          <input
                            id="profile-nickname"
                            value={nicknameDraft}
                            maxLength={MAX_AUTHOR_LENGTH}
                            onChange={(event) => {
                              setNicknameDraft(event.target.value);
                              setNicknameFeedback("");
                              setNicknameError(false);
                            }}
                            className="min-w-0 flex-1 bg-transparent px-0 py-1 text-sm font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
                            placeholder={c.account.nicknamePlaceholder}
                          />
                          <button
                            type="button"
                            onClick={saveNickname}
                            disabled={!canSaveNickname}
                            className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${
                              canSaveNickname
                                ? "text-[var(--accent-strong)] hover:bg-[rgba(184,109,82,0.1)]"
                                : "text-[var(--muted)] opacity-45"
                            } disabled:cursor-not-allowed ${
                              nicknameError ? "shake" : ""
                            }`}
                          >
                            {isSavingNickname ? c.account.saving : c.account.saveNickname}
                          </button>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                          {nicknameHelpText}
                        </p>
                        {nicknameFeedback ? (
                          <p
                            className={`mt-2 rounded-2xl px-3 py-2 text-xs leading-5 ${
                              nicknameError
                                ? "bg-[rgba(184,109,82,0.12)] text-[var(--accent-strong)]"
                                : "bg-[rgba(114,129,109,0.12)] text-[var(--sage)]"
                            }`}
                            role={nicknameError ? "alert" : "status"}
                            aria-live="polite"
                          >
                            {nicknameFeedback}
                          </p>
                        ) : null}
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

                    {profile.mode === "member" ? (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={signOut}
                          className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-strong)]"
                        >
                          {c.account.signOut}
                        </button>
                      </div>
                    ) : null}

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

        {operatorNoticeText ? (
          <div className="notice-strip -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {configuredNoticeUrl ? (
              <a
                href={configuredNoticeUrl}
                className="notice-prompt block text-sm leading-6 text-[var(--muted)] hover:text-[var(--accent-strong)]"
                target="_blank"
                rel="noreferrer"
              >
                {operatorNoticeText}
              </a>
            ) : (
              <p className="notice-prompt text-sm leading-6 text-[var(--muted)]">
                {operatorNoticeText}
              </p>
            )}
          </div>
        ) : null}

        <main className="flex flex-1 flex-col gap-4 pt-2 md:pt-3">
          {isWrite ? (
            <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="paper-panel rounded-[32px] px-6 py-6 sm:px-7">
                <p className="eyebrow text-[11px] text-[var(--sage)]">Writing lounge</p>
                <h2 className="mt-2 display text-4xl">Leave today a little softer</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  No title. No performance. Just one small note about what held you up.
                </p>

                <div className="soft-surface mt-5 rounded-[26px] border border-[var(--line)] p-4 sm:p-5">
                  <label className="text-sm text-[var(--muted)]" htmlFor="gratitude-body">
                    Gratitude note
                  </label>
                  <textarea
                    id="gratitude-body"
                    value={form.body}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, body: event.target.value }))
                    }
                    placeholder={c.home.notePlaceholder}
                    className="mt-3 min-h-56 w-full resize-none rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-4 text-base leading-7 outline-none placeholder:text-[#9a8b81] focus:border-[var(--accent)]"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>{c.home.noteHint}</span>
                    <span>{form.body.length}/{MAX_POST_LENGTH}</span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {profile.mode === "guest" ? (
                      <>
                        <label className="text-sm text-[var(--muted)]">
                          {c.home.authorPlaceholder}
                          <input
                            value={form.author}
                            maxLength={MAX_AUTHOR_LENGTH}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                author: event.target.value,
                              }))
                            }
                            className="mt-2 w-full rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                            placeholder={c.home.authorPlaceholder}
                          />
                        </label>

                        <label className="text-sm text-[var(--muted)]">
                          {c.common.guestPassword}
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
                        </label>
                      </>
                    ) : (
                      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                        <p className="text-sm text-[var(--muted)]">
                          {locale === "ko"
                            ? `표시 이름: ${profile.name}`
                            : `Shown as ${profile.name}.`}
                        </p>
                        <div className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-0.5">
                          {(["public", "hidden"] as const).map((visibility) => (
                            <button
                              key={visibility}
                              type="button"
                              onClick={() =>
                                setForm((current) => ({ ...current, visibility }))
                              }
                              className={`rounded-full px-2.5 py-1 text-[11px] leading-none ${
                                form.visibility === visibility
                                  ? "ink-fill"
                                  : "text-[var(--muted)] hover:bg-[var(--control-hover)]"
                              }`}
                            >
                              {visibility === "public"
                                ? c.common.publicNote
                                : c.common.privateNote}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                    {profile.mode === "member"
                      ? c.home.visibilityHelpMember
                      : c.home.visibilityHelpGuest}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[var(--muted)]">
                      {profile.mode === "member"
                        ? locale === "ko"
                          ? "로그인 글은 내 글에서 다시 다듬을 수 있습니다."
                          : "Signed-in notes can be refined later from My Posts."
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
                              className="soft-control rounded-full px-3 py-2 text-xs text-[var(--foreground)]"
                            >
                              View in My Posts
                            </Link>
                          ) : null}
                          <Link
                            href="/"
                            className="soft-control rounded-full px-3 py-2 text-xs text-[var(--foreground)]"
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
                  <div className="grid grid-cols-2 gap-1 rounded-full bg-[var(--control-surface)] p-1 shadow-[0_10px_26px_rgba(45,36,31,0.035)]">
                    {(["latest", "today"] as const).map((sort) => (
                      <button
                        key={sort}
                        type="button"
                        onClick={() => setFeedSort(sort)}
                        className={`rounded-full px-4 py-2 text-xs font-medium ${
                          feedSort === sort
                            ? "ink-fill shadow-[0_8px_20px_rgba(45,36,31,0.12)]"
                            : "text-[var(--muted)] hover:bg-[var(--control-hover)]"
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
                    <span className="soft-control rounded-full px-3 py-1 text-xs">
                      {c.home.showNewNotes}
                    </span>
                  </button>
                ) : isCheckingFeed ? (
                  <p className="sr-only" aria-live="polite">
                    Checking for new gratitude notes.
                  </p>
                ) : null}

                <div className="flex flex-col gap-5">
                  {visiblePostGroups.map((group) => (
                    <section key={group.key} className="feed-date-section">
                      <div className="feed-date-divider">
                        <span>{group.label}</span>
                      </div>

                      <div className="grid card-grid gap-4">
                        {group.posts.map((post) => {
                          const expanded = expandedIds.includes(post.id);
                          const canExpand =
                            expanded || collapsibleIds.includes(post.id);
                          const isOwnProfilePost =
                            profile.mode === "member" &&
                            profileOwnedIds.includes(post.id);

                          return (
                        <article
                          key={post.id}
                          className={`paper-panel feed-enter flex flex-col rounded-[28px] p-5 ${
                            getFeedCardSizeClass(post.body)
                          } ${isOwnProfilePost ? "own-note-card" : ""}`}
                        >
                          <div className="flex min-w-0 items-start justify-between gap-3 text-sm text-[var(--muted)]">
                            <span
                              className="min-w-0 flex-1 truncate"
                              title={post.author}
                            >
                              {post.author}
                            </span>
                            <span className="shrink-0 whitespace-nowrap text-right">
                              {formatRelative(post.createdAt, locale)}
                            </span>
                          </div>
                          <div
                            ref={(element) => {
                              notePreviewRefs.current[post.id] = element;
                            }}
                            className={`note-preview reading-text note-paragraphs mt-4 text-[15px] leading-8 text-[var(--foreground)] ${
                              expanded
                                ? "note-preview-expanded"
                                : collapsibleIds.includes(post.id)
                                  ? "note-preview-collapsed"
                                  : ""
                            }`}
                          >
                            {renderNoteParagraphs(post.body)}
                          </div>
                          {canExpand ? (
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
                              className={`heart-action inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                                heartedIds.includes(post.id)
                                  ? "bg-[rgba(184,109,82,0.14)] text-[var(--accent-strong)]"
                                  : "soft-control text-[var(--muted)]"
                              } ${heartPopIds.includes(post.id) ? "heart-action-pop" : ""}`}
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
                                className="rounded-full px-3 py-2 text-lg leading-none text-[var(--muted)] hover:bg-[var(--control-hover)]"
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
                                      setIsEditingUnlocked(false);
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
                    </section>
                  ))}
                </div>
                <div ref={feedLoadMoreRef} className="min-h-12">
                  {isLoadingMoreFeed ? (
                    <p className="feed-loading-note">
                      {locale === "ko"
                        ? "이전 감사들을 조용히 불러오는 중"
                        : "Quietly loading older gratitude notes"}
                    </p>
                  ) : null}
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
                  <div className="flex w-fit items-center gap-2">
                    {(["all", "public", "hidden"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setMyPostsFilter(filter)}
                        className={`rounded-full px-3 py-2 text-xs ${
                          myPostsFilter === filter
                            ? "ink-fill"
                            : "soft-control text-[var(--muted)]"
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
                      className="paper-panel rounded-[22px] p-5"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p
                              className="min-w-0 truncate text-sm text-[var(--muted)]"
                              title={post.author}
                            >
                              {post.author}
                            </p>
                            {(post.visibility ?? "public") === "hidden" ? (
                              <span className="shrink-0 rounded-full bg-[rgba(114,129,109,0.14)] px-2 py-1 text-[11px] text-[var(--sage)]">
                                {c.myPosts.privateBadge}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {formatRelative(post.createdAt, locale)}
                          </p>
                        </div>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setActionMenuId((current) =>
                                current === post.id ? null : post.id,
                              );
                            }}
                            className="rounded-full px-3 py-2 text-lg leading-none text-[var(--muted)] hover:bg-[var(--control-hover)]"
                            aria-label="Open note actions"
                          >
                            ⋯
                          </button>
                          {actionMenuId === post.id ? (
                            <div
                              onClick={(event) => event.stopPropagation()}
                              className="absolute right-0 top-full z-20 mt-2 min-w-28 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-2 text-sm shadow-[0_16px_44px_rgba(45,36,31,0.14)]"
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
                                  setIsEditingUnlocked(false);
                                }}
                                className="block w-full rounded-xl px-3 py-2 text-left text-[var(--foreground)] hover:bg-[var(--surface)]"
                              >
                                {c.common.delete}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="reading-text note-paragraphs mt-4 break-words text-sm leading-7">
                        {renderNoteParagraphs(post.body)}
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                            post.hearts > 0
                              ? "bg-[rgba(184,109,82,0.12)] text-[var(--accent-strong)]"
                              : "soft-control text-[var(--muted)]"
                          }`}
                          aria-label={
                            locale === "ko"
                              ? `하트 ${post.hearts}개`
                              : `${post.hearts} hearts`
                          }
                        >
                          <Heart filled={post.hearts > 0} />
                          {post.hearts}
                        </span>
                      </div>
                    </article>
                    ))
                  ) : (
                    <div className="soft-surface rounded-[22px] border border-dashed border-[var(--line)] p-5 text-sm leading-7 text-[var(--muted)]">
                      {c.myPosts.emptyMember}
                    </div>
                  )}
                </div>
              ) : (
                <div className="paper-panel mt-5 rounded-[22px] border-dashed p-5">
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
        <div className="fixed inset-0 z-50 flex items-end bg-[var(--overlay)] p-3 sm:items-center sm:justify-center">
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
                {profile.mode === "guest" ? (
                  <>
                    <input
                      aria-label="Author name"
                      value={form.author}
                      maxLength={MAX_AUTHOR_LENGTH}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          author: event.target.value,
                        }))
                      }
                      className="w-full rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                      placeholder={c.home.authorPlaceholder}
                    />
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
                  </>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <p className="text-xs text-[var(--muted)]">
                      {locale === "ko"
                        ? `표시 이름: ${profile.name}`
                        : `Shown as ${profile.name}.`}
                    </p>
                    <div className="inline-flex w-fit items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface-strong)] p-0.5">
                      {(["public", "hidden"] as const).map((visibility) => (
                        <button
                          key={visibility}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({ ...current, visibility }))
                          }
                          className={`rounded-full px-2.5 py-1 text-[11px] leading-none ${
                            form.visibility === visibility
                              ? "ink-fill"
                              : "text-[var(--muted)] hover:bg-[var(--control-hover)]"
                          }`}
                        >
                          {visibility === "public"
                            ? c.common.publicNote
                            : c.common.privateNote}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
        <div className="fixed inset-0 z-50 flex items-end bg-[var(--overlay)] p-3 sm:items-center sm:justify-center">
          <div className="w-full max-w-xl rounded-[28px] bg-[var(--surface-strong)] p-5 shadow-[0_30px_80px_rgba(45,36,31,0.18)]">
            <p className="eyebrow text-[11px] text-[var(--accent)]">
              {editingId ? c.modal.editEyebrow : c.modal.deleteEyebrow}
            </p>
            <h3 className="mt-2 display text-3xl">
              {editingId ? c.modal.editTitle : c.modal.deleteTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {modalBodyText}
            </p>

            {editingId && !shouldShowEditPasswordFirst ? (
              <>
                <textarea
                  value={editingDraft}
                  onChange={(event) => setEditingDraft(event.target.value)}
                  className="mt-5 min-h-40 w-full rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-sm leading-7 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                />
                {canEditVisibility ? (
                  <div className="mt-3 inline-flex w-fit items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-0.5">
                    {(["public", "hidden"] as const).map((visibility) => (
                      <button
                        key={visibility}
                        type="button"
                        onClick={() => setEditingVisibility(visibility)}
                        className={`rounded-full px-2.5 py-1 text-[11px] leading-none ${
                          editingVisibility === visibility
                            ? "ink-fill"
                            : "text-[var(--muted)] hover:bg-[var(--control-hover)]"
                        }`}
                      >
                        {visibility === "public"
                          ? c.common.publicNote
                          : c.common.privateNote}
                      </button>
                    ))}
                  </div>
              ) : null}
              </>
            ) : null}

            {(() => {
              const candidateId = editingId ?? deleteCandidate;
              const candidate = posts.find((post) => post.id === candidateId);
              const shouldAskPassword =
                candidate &&
                requiresGuestVerification(candidate) &&
                !(editingId && isEditingUnlocked);

              return shouldAskPassword ? (
                <label className="mt-4 block text-sm text-[var(--muted)]">
                  {c.common.guestPassword}
                  <input
                    type="password"
                    value={verification}
                    onChange={(event) => {
                      setVerification(event.target.value);
                      setVerificationError(false);
                    }}
                    className={`mt-2 w-full rounded-full border bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--accent)] ${
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
                  setIsEditingUnlocked(false);
                  setVerificationError(false);
                }}
                className="rounded-full border border-[var(--line)] px-4 py-3 text-sm"
              >
                {c.common.cancel}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={shouldShowEditPasswordFirst ? unlockEdit : saveEdit}
                  disabled={shouldShowEditPasswordFirst && isUnlockingEdit}
                  className={`rounded-full ink-fill px-4 py-3 text-sm  ${
                    verificationError ? "shake" : ""
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {isUnlockingEdit
                    ? c.account.saving
                    : shouldShowEditPasswordFirst
                    ? c.common.continueEdit
                    : c.common.saveChanges}
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
      className="heart-glyph h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M12 20.4 4.85 13.5a4.74 4.74 0 0 1 0-6.84 4.94 4.94 0 0 1 6.95 0L12 6.86l.2-.2a4.94 4.94 0 0 1 6.95 0 4.74 4.74 0 0 1 0 6.84Z" />
    </svg>
  );
}
