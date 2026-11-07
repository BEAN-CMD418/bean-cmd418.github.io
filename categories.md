---
layout: page
title: Categories
permalink: /categories/
---

<p class="categories-intro">정보보안과 컴퓨터공학을 공부하며 기록한 내용을 주제별로 정리합니다.</p>

<div class="category-list">
  {% for category in site.data.categories %}
  <a class="category-list-item" href="{{ category.url | relative_url }}">
    <span class="category-list-number">{{ category.id }}</span>
    <span class="category-list-icon" aria-hidden="true">{{ category.icon }}</span>
    <span class="category-list-content">
      <span class="category-list-title">{{ category.title }}</span>
      <span class="category-list-description">{{ category.description }}</span>
    </span>
    <span class="category-list-arrow" aria-hidden="true">↗</span>
  </a>
  {% endfor %}
</div>
