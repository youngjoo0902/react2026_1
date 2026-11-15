import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

function Settings() {
  const userId = 'youngjoo';
  const userPw = '1111';

  const navigate = useNavigate();
  const [todoListTemplate, setTodoListTemplate] = useState(['']);
  const [savedTemplate, setSavedTemplate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // DB에서 설정값 불러오기
  useEffect(() => {
    getSettings();
  }, []);

    async function getSettings() {
    const { data, error } = await supabase
        .from('todolist_settings')
        .select('todo_list_template')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.log(error);
        alert('설정값을 불러오지 못했습니다.');
        setLoading(false);
        return;
    }

    if (data) {
        const template = data.todo_list_template || [];

        setTodoListTemplate(template.length > 0 ? template : ['']);
        setSavedTemplate(template);
    }

    setLoading(false);
    }

  // input 내용 변경
  function changeTemplate(index, value) {
    const newTemplate = [...todoListTemplate];
    newTemplate[index] = value;
    setTodoListTemplate(newTemplate);
  }

  // 행 추가
  function addRow(index) {
    const newTemplate = [...todoListTemplate];
    newTemplate.splice(index + 1, 0, '');
    setTodoListTemplate(newTemplate);
  }

  // 행 삭제
  function deleteRow(index) {
    const newTemplate = [...todoListTemplate];
    newTemplate.splice(index, 1);

    setTodoListTemplate(newTemplate.length > 0 ? newTemplate : ['']);
  }

  // DB 저장
// DB 저장
async function saveSettings() {
  const newTemplate = todoListTemplate
    .map(item => item.trim())
    .filter(item => item.length > 0);

  setSaving(true);

  // 1. Settings 저장
  const { error: settingsError } = await supabase
    .from('todolist_settings')
    .upsert({
      user_id: userId,
      todo_list_template: newTemplate,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (settingsError) {
    console.log(settingsError);
    alert('설정 저장에 실패했습니다.');
    setSaving(false);
    return;
  }

  // 2. 오늘 날짜 계산
  const today = new Date();

  const dateId =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  // 3. 오늘 날짜의 기존 목록 삭제
  const { error: deleteError } = await supabase
    .from('todolist')
    .delete()
    .eq('date_id', dateId);

  if (deleteError) {
    console.log(deleteError);
    alert('오늘의 목록 삭제에 실패했습니다.');
    setSaving(false);
    return;
  }

  // 4. 새로운 템플릿으로 오늘의 목록 생성
  if (newTemplate.length > 0) {
    const newTodos = newTemplate.map(title => ({
      date_id: dateId,
      title: title,
      summary: '',
      checked: false
    }));

    const { error: insertError } = await supabase
      .from('todolist')
      .insert(newTodos);

    if (insertError) {
      console.log(insertError);
      alert('오늘의 목록 생성에 실패했습니다.');
      setSaving(false);
      return;
    }
  }

  // 5. 저장 상태 갱신
  setTodoListTemplate(newTemplate.length > 0 ? newTemplate : ['']);
  setSavedTemplate(newTemplate);

  setSaving(false);

  // 6. Lists 페이지로 이동
  navigate('/Lists');
}

  // 취소
  function cancelSettings() {
    setTodoListTemplate(
      savedTemplate.length > 0 ? [...savedTemplate] : ['']
    );
    navigate('/Lists');
  }

  if (loading) {
    return <div className="app">불러오는 중...</div>;
  }

  return (
    <div className="app">
        <div className="nav">
            <h1><a href="/react2026_1/">영주님의 투두리스트</a></h1>
        </div>
      <div className="settings">
        <h2>Settings</h2>
        <ul>
          {todoListTemplate.map((item, index) => (
            <li key={index}>
              <label>
                <input type="text" placeholder="내용을 입력하세요" value={item} onChange={(e) => changeTemplate(index, e.target.value)} />
              </label>
              <button className="add" onClick={() => addRow(index)}>+</button>
              <button className="remove" onClick={() => deleteRow(index)}>-</button>
            </li>
          ))}
        </ul>

        <p className="save_data">
          <button className="save" onClick={saveSettings} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
          <button className="cancel" onClick={cancelSettings}>취소</button>
        </p>
      </div>
    </div>
  );
}

export default Settings;
