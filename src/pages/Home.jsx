import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    return (
        <div className="app">
            <div className="login">
                <h1><a href="/react2026_1/">영주님의 투두리스트</a></h1>
                <dl>
                    <dt>닉네임</dt>
                    <dd>
                        <label><input type="text" placeholder="닉네임을 입력하세요" /></label>
                    </dd>
                    <dt>비밀번호</dt>
                    <dd>
                        <label><input type="password" placeholder="비밀번호를 입력하세요" /></label>
                    </dd>
                    <dt>로그인 / 회원탈퇴</dt>
                    <dd>
                        <button>로그인</button>
                        <button>회원탈퇴</button>
                    </dd>
                </dl>
                <ul>
                    <li>본 페이지는 어떤 정보도 수집하지 않습니다.</li>
                    <li>닉네임과 비밀번호를 입력하는 것만으로 계정이 생성됩니다.</li>
                    <li>닉네임과 비밀번호를 입력하시고, 회원탈퇴 버튼을 누르면 입력하신 정보는 모두 삭제됩니다.</li>
                </ul>
                <p>
                    <button onClick={() => navigate('/Lists')}>목록</button>
                </p>
            </div>
        </div>
    );
}

export default Home;