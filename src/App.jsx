/* eslint-disable */  //이걸 하면 warning message 사라짐

import { use, useState } from 'react'
import './App.css'

function App() {
  let [blogList, setBlogList] = useState(["제목1111", "제목2", "제목3"]);
  let [blogSummary, setblogSummary] = useState(["내용1", "내용2", "내용3"]);
  let [thumsbup, setThumsbup] = useState([0, 0, 0]);
  let [modal, setModal] = useState(false);
  let [modalKey, setModalKey] = useState(0);
  let [input, setInput] = useState('');

  function changeTitle() {
    let newList = [...blogList];
    newList[0] = '제목1 변경';
    setBlogList(newList);
  }

  function changeThumbsup(index) {
    let newThumbsup = [...thumsbup];
    newThumbsup[index] = newThumbsup[index] + 1;
    setThumsbup(newThumbsup);
  }

  return (
    <div className="app">
      <div className="nav">
        <h4>My Way 블로그</h4>
      </div>
      <ul className="blog_list">
        {
          blogList.map((title, index) => (
            <li key={index}>
              <p class="title" onClick={() => {
                setModal(true);
                setModalKey(index);
              }}>
                {title}
              </p>
              <p class="subject">
                <span onClick={() => changeThumbsup(index)}>👍</span>{thumsbup[index]}
                {blogSummary[index]}
              </p>
              <button onClick={() => {
                let newBlogList = [...blogList];
                newBlogList.splice(index, 1);
                setBlogList(newBlogList);
              }}>삭제</button>
            </li>
          )) 
        }
      </ul>
      {modal && <Modal number={modalKey} blogList={blogList}></Modal>}
      <input type="text" onChange={(e) => setInput(e.target.value)} value={input}></input>
      <button onClick={() => {
        if(input.length === 0) return;
        let newBlogList = [input, ...blogList];
        // newBlogList.unshift(input);
        setBlogList(newBlogList);
        setInput('');
      }}>글 발행</button>
    </div>
  )
}

function Modal(props){
  return (
      <div className="modal">
        <h4>{props.blogList[props.number]}</h4>
        <p>날짜</p>
        <p>상세내용</p>
      </div>
  )
}

export default App
