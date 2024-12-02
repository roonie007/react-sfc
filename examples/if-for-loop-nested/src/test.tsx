import React from "react";

import "./Categories.css";

const Categories = () => {
  const categories = [
    {
      name: "Fruits",
      items: [
        { name: "Apple", isAvailable: true },
        { name: "Banana", isAvailable: false },
      ],
    },
    {
      name: "Vegetables",
      items: [
        { name: "Carrot", isAvailable: true },
        { name: "Broccoli", isAvailable: true },
      ],
    },
  ];

  return (
    <div>
      <h2>Categories</h2>
      <ul>
        {categories.map((category) => (
          <li key={category.name}>
            <strong>{category.name}</strong>
            <ul>
              {category.items.map((item) => (
                <li key={item.name}>
                  {item.isAvailable && <span>{item.name}</span>}
                  {!item.isAvailable && (
                    <span className="not-available">{item.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categories;
