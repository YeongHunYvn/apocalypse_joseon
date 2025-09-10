// 데이터 로더 기능 테스트를 위한 간단한 스크립트

const dataLoader = require('./dataLoader');

console.log('📋 데이터 로더 테스트 시작...\n');

try {
  // 1. 상태 테스트
  console.log('🏷️ 상태 테스트:');
  const buff1 = dataLoader.getBuffById('fatigue');
  console.log('  - fatigue 상태:', buff1);

  const buff2 = dataLoader.getBuffById('unknown_buff');
  console.log('  - 존재하지 않는 상태:', buff2);

  const temporaryBuffs = dataLoader.getTemporaryBuffs();
  console.log('  - 임시 상태 목록:', temporaryBuffs);

  // 2. 플래그 테스트
  console.log('\n🏁 플래그 테스트:');
  const flag1 = dataLoader.getFlagById('has_key');
  console.log('  - has_key 플래그:', flag1);

  // 3. 아이템 테스트
  console.log('\n🎒 아이템 테스트:');
  const item1 = dataLoader.getItemById('health_potion');
  console.log('  - health_potion 아이템:', item1);

  // 4. 캐시 상태 확인
  console.log('\n💾 캐시 상태:');
  // 캐시 상태 확인 함수는 개발 중 제거되었습니다.

  console.log('\n✅ 모든 테스트 완료!');
} catch (error) {
  console.error('❌ 테스트 실패:', error);
}
