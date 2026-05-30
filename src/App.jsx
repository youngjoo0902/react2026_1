/* eslint-disable */  //이걸 하면 warning message 사라짐

import { use, useEffect, useState } from 'react';
import { useRef } from 'react';
import { supabase } from './supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css'

function App() {
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
  let todoListTemplate = ['약 5종 먹기', '턱걸이 5회 x 3세트', '스쿼트 10회 x 3세트', '푸쉬업 10회 x 3세트', '덤벨프레스 10회 x 3세트', '단백질 파우더 마시기', '공부 30분', '샤워', '약 2종 먹기'];

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

  useEffect(() => {//useEffect는 컴포넌트가 렌더링 될 때마다 특정 작업을 수행할 수 있게 해주는 Hook입니다. 빈 배열을 두 번째 인자로 전달하면, 이 효과는 컴포넌트가 처음 마운트될 때 한 번만 실행됩니다.
    getPosts();
  }, []);

  useEffect(() => {
    if (editingIndex !== null) {
      inputRefs.current[editingIndex]?.focus();
    }
  }, [editingIndex]);

  useEffect(() => {
    createTodayTodoIfNeeded();
  }, []);

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
  //제목 수정
  async function updatePost(id, newTitle) {
    await supabase.from('todolist').update({
      title: newTitle
    }).eq('id', id);
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
    const today = new Date();
    const dateId = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const { data } = await supabase.from('todolist').select('id').eq('date_id', dateId).limit(1);
    if (data.length > 0) {
      return;
    }
    const newTodos = [];
    todoListTemplate.map((title) => 
      newTodos.push({
        date_id: dateId,
        title: title,
        summary: '',
        checked: false
    }));

    await supabase.from('todolist').insert(newTodos);

    getPosts();
  }

  return (
    <div className="app">
      <div className={menuOpen ? "nav on" : "nav"}>
        <h4>아무나 수정가능한 마이웨이 투두리스트</h4>
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
      <p className="todoAdd"><button onClick={setAddTodoOpen}>추가</button></p>
      
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

export default App
