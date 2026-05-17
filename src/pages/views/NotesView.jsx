import { useEffect, useState } from "react";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import Input from "../../ui/Input";

const NOTE_PASSWORD = "1191961314qweLHT";
const STORAGE_KEY = "liangos-notes-content";
const DEFAULT_NOTE_CONTENT =
  "这里替换成我的苹果备忘录内容。\n\n这是一个 React 版私人备忘录页面。\n\n后续可以继续扩展为可编辑、可保存的个人记录系统。";

function NotesView() {
  const [notePassword, setNotePassword] = useState("");
  const [isNoteUnlocked, setIsNoteUnlocked] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteContent, setNoteContent] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) return saved;
    } catch {
      /* ignore */
    }
    return DEFAULT_NOTE_CONTENT;
  });

  useEffect(() => {
    if (noteContent !== "") {
      localStorage.setItem(STORAGE_KEY, noteContent);
    }
  }, [noteContent]);

  function handleUnlock() {
    if (notePassword === NOTE_PASSWORD) {
      setIsNoteUnlocked(true);
      setNoteError("");
    } else {
      setNoteError("密码错误");
    }
  }

  function handleLock() {
    setIsNoteUnlocked(false);
    setNotePassword("");
    setNoteError("");
  }

  function handleClear() {
    setNoteContent("");
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <section className="bento">
      <section className="bento__span-12">
        <Card
          title="私人备忘录"
          subtitle={isNoteUnlocked ? "已解锁 · 自动保存到本地" : "需要密码访问"}
        >
          {!isNoteUnlocked ? (
            <>
              <p>请输入备忘录密码以查看内容。</p>
              <Input
                type="password"
                placeholder="备忘录密码"
                value={notePassword}
                onChange={(e) => setNotePassword(e.target.value)}
              />
              <p className="ui-message">{noteError}</p>
              <Button onClick={handleUnlock}>解锁备忘录</Button>
            </>
          ) : (
            <>
              <textarea
                className="ui-textarea"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={12}
              />
              <section className="ui-row-actions">
                <Button variant="ghost" onClick={handleClear}>
                  清空备忘录
                </Button>
                <Button variant="ghost" onClick={handleLock}>
                  锁定备忘录
                </Button>
              </section>
            </>
          )}
        </Card>
      </section>
    </section>
  );
}

export default NotesView;
