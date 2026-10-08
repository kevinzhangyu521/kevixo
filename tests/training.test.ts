import { resolveTraining } from '../lib/training';
function a(x: unknown,m:string){if(!x)throw Error(m)}
a(resolveTraining([],[]).source==='general','general');
a(resolveTraining([{reviewId:'r',createdAt:'2026-10-01',source:'hand_history',lesson:'Check ranges'}],[]).source==='latest_review','latest');
a(resolveTraining([{reviewId:'r',createdAt:'2026-10-01',source:'hand_history',lesson:'x'}],[{name:'River bluff-catching',checkNext:'Name value and bluffs',supportingReviews:[{reviewId:'r'}]}]).source==='repeated_theme','theme');
console.log('training tests passed');
