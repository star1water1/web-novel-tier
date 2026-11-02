# 맨 위로 버튼 (scroll-top)

탭 메뉴는 메인 `ScrollView` 안에 있어 내리면 함께 사라진다. 한 화면 이상 내리면 오른쪽 아래에 버튼을 띄워 바로 맨 위로 돌아가게 한다.

- `App.jsx`는 메인 `ScrollView`의 `onScroll`에서 `setOffset(y)`를 부르고, 눌렸을 때 `scrollTo({ y: 0, animated: false })`를 한다.
- 긴 목록을 애니메이션으로 올리면 오래 걸리므로 바로 이동한다.
- 보임 상태는 이 컴포넌트에 있다. `App`의 state로 옮기면 경계를 넘을 때마다 앱 전체가 다시 그려진다.
- 모달 안의 스크롤은 대상이 아니다.
