import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getFirestore, onSnapshot,
  orderBy, query, serverTimestamp, setDoc, updateDoc, where,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig, defaultGroupId } from "./firebase-config.js";

const elements = Object.fromEntries([
  "user-panel", "user-name", "user-email", "logout-button", "message", "login-view",
  "login-button", "memo-view", "group-name", "add-button", "loading", "empty-state",
  "memo-list", "memo-dialog", "memo-form", "dialog-title", "close-button", "cancel-button",
  "delete-button", "save-button", "memo-title", "memo-body",
].map((id) => [id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), document.getElementById(id)]));

let auth;
let db;
let currentUser = null;
let editingMemoId = null;
let unsubscribeMemos = null;

function showMessage(text, type = "error") {
  elements.message.textContent = text;
  elements.message.className = `message${type === "success" ? " success" : ""}`;
  elements.message.hidden = false;
}

function clearMessage() {
  elements.message.hidden = true;
  elements.message.textContent = "";
}

function readableError(error, fallback) {
  console.error(error);
  if (error?.code === "auth/popup-closed-by-user") return "ログイン画面が閉じられました。もう一度お試しください。";
  if (error?.code === "auth/popup-blocked") return "ログイン画面がブロックされました。ポップアップを許可してください。";
  if (error?.code === "permission-denied") return "この操作を行う権限がありません。";
  return fallback;
}

function resetSignedOutView() {
  unsubscribeMemos?.();
  unsubscribeMemos = null;
  currentUser = null;
  if (elements.memoDialog.open) closeMemoDialog();
  elements.userPanel.hidden = true;
  elements.memoView.hidden = true;
  elements.loginView.hidden = false;
  elements.memoList.replaceChildren();
}

async function saveUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const profile = { displayName: user.displayName || "名前未設定", email: user.email || "" };
  if (snapshot.exists()) {
    await setDoc(userRef, profile, { merge: true });
  } else {
    await setDoc(userRef, { ...profile, createdAt: serverTimestamp() });
  }
}

async function enterGroup(user) {
  const groupSnapshot = await getDoc(doc(db, "groups", defaultGroupId));
  if (!groupSnapshot.exists() || !groupSnapshot.data().members?.includes(user.uid)) {
    elements.memoView.hidden = true;
    showMessage("このグループを利用する権限がありません。");
    return;
  }

  elements.groupName.textContent = groupSnapshot.data().name || "共有グループ";
  elements.memoView.hidden = false;
  listenForMemos();
}

function listenForMemos() {
  unsubscribeMemos?.();
  elements.loading.hidden = false;
  const memoQuery = query(
    collection(db, "memos"),
    where("groupId", "==", defaultGroupId),
    orderBy("updatedAt", "desc"),
  );
  unsubscribeMemos = onSnapshot(memoQuery, (snapshot) => {
    elements.loading.hidden = true;
    elements.emptyState.hidden = !snapshot.empty;
    elements.memoList.replaceChildren(...snapshot.docs.map(createMemoCard));
  }, (error) => {
    elements.loading.hidden = true;
    showMessage(readableError(error, "メモの取得に失敗しました。通信状態とFirestoreの設定を確認してください。"));
  });
}

function createMemoCard(memoSnapshot) {
  const memo = memoSnapshot.data();
  const card = document.createElement("article");
  card.className = "memo-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${memo.title || "無題"}を編集`);

  const title = document.createElement("h2");
  title.textContent = memo.title || "無題";
  const body = document.createElement("p");
  body.className = "memo-preview";
  body.textContent = truncate(memo.body || "", 110);
  const meta = document.createElement("div");
  meta.className = "memo-meta";
  const updater = document.createElement("span");
  updater.textContent = `更新：${memo.updatedByName || "不明"}`;
  const date = document.createElement("time");
  date.textContent = formatTimestamp(memo.updatedAt);
  meta.append(updater, date);
  card.append(title, body, meta);

  const open = () => openMemoDialog(memoSnapshot.id, memo);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
  });
  return card;
}

function truncate(text, length) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function formatTimestamp(timestamp) {
  if (!timestamp?.toDate) return "更新日時を同期中…";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(timestamp.toDate());
}

function openMemoDialog(id = null, memo = {}) {
  clearMessage();
  editingMemoId = id;
  elements.dialogTitle.textContent = id ? "メモ編集" : "メモ追加";
  elements.memoTitle.value = memo.title || "";
  elements.memoBody.value = memo.body || "";
  elements.deleteButton.hidden = !id;
  elements.memoDialog.showModal();
  elements.memoTitle.focus();
}

function closeMemoDialog() {
  editingMemoId = null;
  elements.memoForm.reset();
  elements.memoDialog.close();
}

async function saveMemo(event) {
  event.preventDefault();
  const title = elements.memoTitle.value.trim();
  const body = elements.memoBody.value.trim();
  if (!title || !body) return;
  setFormBusy(true);
  const editor = { updatedBy: currentUser.uid, updatedByName: currentUser.displayName || "名前未設定", updatedAt: serverTimestamp() };
  try {
    if (editingMemoId) {
      await updateDoc(doc(db, "memos", editingMemoId), { title, body, ...editor });
      closeMemoDialog();
      showMessage("メモを更新しました。", "success");
    } else {
      await addDoc(collection(db, "memos"), {
        groupId: defaultGroupId, title, body,
        createdBy: currentUser.uid, createdByName: currentUser.displayName || "名前未設定",
        createdAt: serverTimestamp(), ...editor,
      });
      closeMemoDialog();
      showMessage("メモを保存しました。", "success");
    }
  } catch (error) {
    showMessage(readableError(error, editingMemoId ? "メモの更新に失敗しました。" : "メモの保存に失敗しました。"));
  } finally {
    setFormBusy(false);
  }
}

async function deleteMemo() {
  if (!editingMemoId || !window.confirm("このメモを削除しますか？")) return;
  setFormBusy(true);
  try {
    await deleteDoc(doc(db, "memos", editingMemoId));
    closeMemoDialog();
    showMessage("メモを削除しました。", "success");
  } catch (error) {
    showMessage(readableError(error, "メモの削除に失敗しました。"));
  } finally {
    setFormBusy(false);
  }
}

function setFormBusy(busy) {
  elements.saveButton.disabled = busy;
  elements.deleteButton.disabled = busy;
  elements.saveButton.textContent = busy ? "処理中…" : "保存";
}

function bindEvents() {
  elements.loginButton.addEventListener("click", async () => {
    clearMessage();
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (error) { showMessage(readableError(error, "Googleログインに失敗しました。")); }
  });
  elements.logoutButton.addEventListener("click", async () => {
    try { await signOut(auth); clearMessage(); }
    catch (error) { showMessage(readableError(error, "ログアウトに失敗しました。")); }
  });
  elements.addButton.addEventListener("click", () => openMemoDialog());
  elements.memoForm.addEventListener("submit", saveMemo);
  elements.deleteButton.addEventListener("click", deleteMemo);
  elements.closeButton.addEventListener("click", closeMemoDialog);
  elements.cancelButton.addEventListener("click", closeMemoDialog);
  elements.memoDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeMemoDialog(); });
}

function start() {
  const missingConfig = Object.values(firebaseConfig).some((value) => (
    value.startsWith("YOUR_") || value === "Firebase Consoleに表示された値"
  ));
  if (missingConfig) {
    elements.loginButton.disabled = true;
    showMessage("Firebaseの設定が未完了です。firebase-config.jsを設定してください。");
    return;
  }
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    bindEvents();
    onAuthStateChanged(auth, async (user) => {
      clearMessage();
      if (!user) { resetSignedOutView(); return; }
      currentUser = user;
      elements.loginView.hidden = true;
      elements.userPanel.hidden = false;
      elements.userName.textContent = user.displayName || "名前未設定";
      elements.userEmail.textContent = user.email || "";
      try { await saveUserProfile(user); await enterGroup(user); }
      catch (error) { showMessage(readableError(error, "Firebaseへの接続に失敗しました。設定と通信状態を確認してください。")); }
    });
  } catch (error) {
    showMessage(readableError(error, "Firebaseの初期化に失敗しました。設定を確認してください。"));
  }
}

start();
