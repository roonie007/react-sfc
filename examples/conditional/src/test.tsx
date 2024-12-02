import React from "react";
import { useState, useEffect } from "react";
import "virtual:css-0.css";
import "virtual:scss-1.scss";

const Counter = () => {



const [count, setCount] = useState<number>(10);




useEffect(() => {
  console.log('counter', count);
}, [count]);


  return (<>

  <h1>React</h1>
  <div className="card">
    <button onClick={() => setCount((count) => count + 1)}>
      count is {count}
    </button>
  </div>
  {count === 1 && (<span>count is 1</span>)}
  {count === 2 && (<span>count is 2</span>)}
  {count === 3 && (<span>count is 3</span>)}
  {count > 3 && (<span>count is greater than 3

    {count > 5 && (<span>count is greater than 5

      {count > 7 && (<span>count is greater than 7

        {count > 9 && (<span>count is greater than 9</span>)})})})}
      </span>
    </span>
  </span>


  {/* This is a separate template, but it will be rendered in the same component */}
  <span> {count} - 10 = {count - 10} </span>

  </>)
};

export default Counter;