/* eslint-disable */  //이걸 하면 warning message 사라짐

import { useEffect, useState } from 'react';
import { useRef } from 'react';
import { supabase } from '../supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrashCan, faGear } from '@fortawesome/free-solid-svg-icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from "react-router-dom";

function Lists() {
  const navigate = useNavigate();
  const userId = 'youngjoo';

  let [lists, setLists] = useState([]);
  let [menuOpen, setMenuOpen] = useState(false);
  let [selectNumber, setSelectNumber] = useState(0);
  let [changedIndex, setChangedIndex] = useState(0);
  let [editingIndex, setEditingIndex] = useState(null);
  let inputRefs = useRef([]);
  let [addTodoOpen, setAddTodoOpen] = useState(false);
  let [selectedDate, setSelectedDate] = useState(new Date());
  let [title, setTitle] = useState('');
  let [summary, setSummary] = useState('');

  //메뉴 변경
  function changeMenu(index){
    setSelectNumber(index);
    setEditingIndex(null);
    setMenuOpen(false);
  }
  function changeChecked(index){
    const newLists = [...lists];
    const todo = newLists[selectNumber].todo[index];
    todo.checked = !todo.checked;

    setLists(newLists);
    updateChecked(
      todo.id,
      todo.checked
    );
  }
  function changeTitleOpen(index){/*인풋으로 포커스 보내야 함*/
    setEditingIndex(index);
  }
  function changingTitle(index, newTitle){
    const newLists = [...lists];
    newLists[selectNumber].todo[index].title = newTitle;
    setLists(newLists);

    //setEditingIndex(null);
  }
  function changeTitleClose(index, newTitle){/* 인풋에서 포커스 빼고, 타이틀을 갱신해줘야 함 */
    // 화면 데이터 수정
    const newLists = [...lists];
    newLists[selectNumber].todo[index].title = newTitle;
    setLists(newLists);

    setEditingIndex(null);

    // DB 수정
    updatePost(lists[selectNumber].todo[index].id, newTitle);
  }
  function dataRepactoring(fromDB){//데이터 가공 함수, DB에서 받아온 데이터를 프론트에서 쓰기 좋게 가공해주는 함수
    const grouped = {};

    fromDB.forEach(item => {
      const yyyymmdd = String(item.date_id);

      const date =
        `${yyyymmdd.slice(0,4)}-${
          yyyymmdd.slice(4,6)}-${
          yyyymmdd.slice(6,8)}`;

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push({
        id : item.id,
        title: item.title,
        summary: item.summary,
        checked: item.checked
      });
    });

    return Object.entries(grouped).map(([date, todo]) => ({
      date,
      todo
    }));
  }

    useEffect(() => {
    createTodayTodoIfNeeded();
    }, []);

    useEffect(() => {
    if (editingIndex !== null) {
        inputRefs.current[editingIndex]?.focus();
    }
    }, [editingIndex]);

  //읽기
  async function getPosts() {
    const { data, error } = await supabase.from('todolist').select('*').order('date_id', { ascending: false }).order('id', { ascending: true });

    if (!error) {
      setLists(dataRepactoring(data));
    }
  }
  //추가
  async function addPost() {

    const dateId = selectedDate.getFullYear() * 10000 + (selectedDate.getMonth() + 1) * 100 + selectedDate.getDate();

    const { error } = await supabase.from('todolist').insert([
      {
        date_id: dateId,
        title: title,
        summary: summary,
        checked: false
      }
    ]);
    setAddTodoOpen(false);

    if (error) {
      console.log(error);
      return;
    }

    getPosts();

    setTitle('');
    setSummary('');
  }
  //삭제
  async function deletePost(id) {
    await supabase.from('todolist').delete().eq('id', id);
    getPosts();
  }
// 제목 수정
async function updatePost(id, newTitle) {

  // 1. 기존 제목 가져오기
  const { data: oldTodo, error: oldError } = await supabase
    .from('todolist')
    .select('title')
    .eq('id', id)
    .single();

  if (oldError) {
    console.log(oldError);
    return;
  }

  // 2. todolist 수정
  const { error: updateError } = await supabase
    .from('todolist')
    .update({
      title: newTitle
    })
    .eq('id', id);

  if (updateError) {
    console.log(updateError);
    return;
  }

  // 3. Settings 템플릿 가져오기
  const { data: settings, error: settingsError } = await supabase
    .from('todolist_settings')
    .select('todo_list_template')
    .eq('user_id', userId)
    .single();

  if (settingsError) {
    console.log(settingsError);
    getPosts();
    return;
  }

  // 4. 기존 제목을 새 제목으로 교체
  const template = [...settings.todo_list_template];

  const index = template.indexOf(oldTodo.title);

  if (index !== -1) {
    template[index] = newTitle;

    // 5. Settings 저장
    const { error: templateError } = await supabase
      .from('todolist_settings')
      .update({
        todo_list_template: template
      })
      .eq('user_id', userId);

    if (templateError) {
      console.log(templateError);
    }
  }

  // 6. 목록 새로고침
  getPosts();
}
  //체크박스 수정
  async function updateChecked(id, checked) {
    const { error } = await supabase.from('todolist').update({
        checked: checked
      }).eq('id', id);

    if (error) {
      console.log(error);
    }
  }

    //매일 양식 자동추가
    async function createTodayTodoIfNeeded() {

    // 1. Settings에서 저장한 템플릿 불러오기
    const { data: settings, error } = await supabase
        .from('todolist_settings')
        .select('todo_list_template')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.log(error);
        return;
    }

    const todoListTemplate = settings?.todo_list_template || [];

    // 저장된 템플릿이 없으면 종료
    if (todoListTemplate.length === 0) {
        getPosts();
        return;
    }

    // 2. 오늘 날짜 계산
    const today = new Date();

    const dateId =
        today.getFullYear() * 10000 +
        (today.getMonth() + 1) * 100 +
        today.getDate();

    // 3. 오늘 날짜의 목록이 이미 있는지 확인
    const { data, error: checkError } = await supabase
        .from('todolist')
        .select('id')
        .eq('date_id', dateId)
        .limit(1);

    if (checkError) {
        console.log(checkError);
        return;
    }

    if (data.length > 0) {
        getPosts();
        return;
    }

    // 4. 오늘의 목록이 없다면 템플릿으로 생성
    const newTodos = todoListTemplate.map((title) => ({
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
        return;
    }

    // 5. 전체 목록 다시 불러오기
    getPosts();
    }

  return (
    <div className="app">
      <div className={menuOpen ? "nav on" : "nav"}>
        <h1><a href="/react2026_1/">영주님의 투두리스트</a></h1>
        <button className="setting" onClick={() => navigate('/settings')}>
          <FontAwesomeIcon icon={faGear} />
        </button>
        <button className="menu" onClick={() => setMenuOpen(!menuOpen)}><span></span></button>
        <div className="menu_list">
          <p className="date">Date</p>
          <menu>
            {
              lists?.map((list, i) =>
                <li key={i} onClick={() => changeMenu(i)}>
                  {list.date}
                </li>
              )
            }
          </menu>
        </div>
      </div>
      <div className="todo_list">
        <p className="date">{lists?.[selectNumber]?.date}</p>
        <ul>
          {
            lists?.[selectNumber]?.todo.map((todo, i) =>
              <li key={i}>
                <label className={todo.checked ? "check on" : "check"}>
                  {<input type="checkbox" checked={todo.checked} onChange={() => changeChecked(i)} />}
                  <div className={editingIndex === i ? "title edit" : "title"}>
                    <p className="view">
                      {todo.title}
                      <FontAwesomeIcon icon={faPenToSquare} onClick={(e) => {e.preventDefault(); changeTitleOpen(i)}} />
                      <FontAwesomeIcon icon={faTrashCan} onClick={(e) => {e.preventDefault(); deletePost(todo.id)}} />
                    </p>
                    <p className="editor">
                      {/* <input ref={el => inputRefs.current[i] = el} type="text" placeholder={todo.title} value={todo.title} onBlur={(e) => {e.target.value.length > 0 ? changeTitleClose(i, e.target.value) : changeTitleClose(i, todo.title)}} /> */}
                      <input ref={el => inputRefs.current[i] = el} type="text" placeholder={todo.title} value={todo.title} onChange={(e) => {changingTitle(i, e.target.value)}} onBlur={(e) => {e.target.value.length > 0 ? changeTitleClose(i, e.target.value) : changeTitleClose(i, todo.title)}} />
                    </p>
                  </div>
                </label>
                <p className="subject">{todo.summary}</p>
              </li>
            )
          }
        </ul>
      </div>
      {/* <p className="todoAdd"><button onClick={setAddTodoOpen}>추가</button></p> */}
      
      {
        addTodoOpen && 
        <div className="addTodoList">
          <button className="close" onClick={() => setAddTodoOpen(false)}></button>
          <table>
            <colgroup>
              <col style={{ width: '30%' }} />
              <col style={{ width: '70%' }} />
            </colgroup>
            <tbody>
              <tr>
                <th>날짜선택</th>
                <td><DatePicker selected={selectedDate} onChange={(date) => setSelectedDate(date)} /></td>
              </tr>
              <tr>
                <th>할일</th>
                <td><input type="text" placeholder="할일을 입력하세요" value={title} onChange={(e) => e.target.value.length > 0 && setTitle(e.target.value)} /></td>
              </tr>
              <tr>
                <th>내용</th>
                <td><textarea placeholder="내용을 입력하세요" value={summary} onChange={(e) => setSummary(e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
          <p className="add" onClick={addPost}><button>전송</button></p>
        </div>
      }
    </div>
  )
}

export default Lists;
