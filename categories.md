---
layout: page
title: Categories
permalink: /categories/
---

<p class="categories-intro"></p>

<div class="category-list">
  {% for category in site.data.categories %}
  <a class="category-list-item" href="{{ category.url | relative_url }}">
    <span class="category-list-number">{{ category.id }}</span>
    <span class="category-list-icon" aria-hidden="true">{% case category.id %}{% when '01' %}<svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>{% when '02' %}<svg viewBox="0 0 24 24"><path d="M4 22V4"/><path d="M4 4c6-4 10 4 16 0v12c-6 4-10-4-16 0"/></svg>{% when '03' %}<svg viewBox="0 0 24 24"><path d="M8 8 6 6M16 8l2-2M9 3h6M12 3v3"/><rect x="7" y="6" width="10" height="15" rx="5"/><path d="M3 11h4M17 11h4M3 16h4M17 16h4M12 6v15"/></svg>{% when '04' %}<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 5.5v12M8 7h8M8 11h8"/></svg>{% when '05' %}<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>{% when '06' %}<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/></svg>{% endcase %}</span>
    <span class="category-list-content">
      <span class="category-list-title">{{ category.title }}</span>
    </span>
  </a>
  {% endfor %}
</div>
