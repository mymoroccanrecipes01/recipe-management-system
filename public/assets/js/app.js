// Navigation et fonctions globales
class RecipeApp {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.initNavigation();
        this.setupEventListeners();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'home';
        if (path.startsWith('/recipes/')) return 'recipe-detail';
        if (path.startsWith('/recipes')) return 'recipes-list';
        if (path.startsWith('/categories/')) return 'category-detail';
        if (path.startsWith('/categories')) return 'categories-list';
        if (path.startsWith('/search')) return 'search';
        if (path.startsWith('/admin')) return 'admin';
        return 'home';
    }

    initNavigation() {
        // Mobile menu toggle
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Active nav link
        this.updateActiveNavLink();
    }

    updateActiveNavLink() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === window.location.pathname || 
                (href === '/' && window.location.pathname === '/index.html')) {
                link.classList.add('active');
            }
        });
    }

    setupEventListeners() {
        // Fermer menu mobile en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            const navMenu = document.getElementById('navMenu');
            const navToggle = document.getElementById('navToggle');
            
            if (navMenu && navToggle && 
                !navMenu.contains(e.target) && 
                !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }
}

// Fonctions utilitaires globales
function navigateTo(path) {
    window.location.href = path;
}

function showToast(message, type = 'success') {
    // Supprimer toast existant
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Créer nouveau toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    toast.style.display = 'block';

    // Auto-hide après 3 secondes
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatTime(minutes) {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
}

function formatDifficulty(difficulty) {
    const levels = {
        'facile': 'Facile',
        'moyen': 'Moyen', 
        'difficile': 'Difficile'
    };
    return levels[difficulty] || difficulty;
}

// Classes pour différentes pages
class RecipesList {
    constructor() {
        this.recipes = [];
        this.currentPage = 1;
        this.filters = {
            category: null,
            difficulty: null,
            time: null,
            search: ''
        };
        this.init();
    }

    async init() {
        await this.loadRecipes();
        this.setupFilters();
        this.renderRecipes();
    }

    async loadRecipes() {
        try {
            const params = new URLSearchParams();
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            params.append('page', this.currentPage);

            const response = await fetch(`/api/recipes?${params}`);
            const data = await response.json();
            this.recipes = data.recipes || [];
        } catch (error) {
            console.error('Erreur chargement recettes:', error);
            showToast('Erreur lors du chargement des recettes', 'error');
        }
    }

    setupFilters() {
        // Recherche
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.debounceSearch();
            });
        }

        // Filtres catégorie, difficulté, temps
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const filterType = e.target.dataset.filter;
                this.filters[filterType] = e.target.value || null;
                this.applyFilters();
            });
        });
    }

    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    async applyFilters() {
        this.currentPage = 1;
        await this.loadRecipes();
        this.renderRecipes();
    }

    renderRecipes() {
        const container = document.getElementById('recipesContainer');
        if (!container) return;

        if (this.recipes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-light); margin-bottom: 20px;"></i>
                    <h3>Aucune recette trouvée</h3>
                    <p>Essayez de modifier vos critères de recherche</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.recipes.map(recipe => `
            <div class="recipe-card" onclick="navigateTo('/recipes/${recipe.slug}')">
                <div class="recipe-image">
                    <img src="${recipe.image_url || '/assets/images/default-recipe.jpg'}" 
                         alt="${recipe.title}" loading="lazy">
                    <div class="recipe-badge">
                        <i class="fas fa-star"></i>
                        ${recipe.rating || '4.5'}
                    </div>
                </div>
                <div class="recipe-content">
                    <h3>${recipe.title}</h3>
                    <p>${recipe.description}</p>
                    <div class="recipe-meta">
                        <span><i class="fas fa-clock"></i> ${formatTime(recipe.prep_time + recipe.cook_time)}</span>
                        <span><i class="fas fa-users"></i> ${recipe.servings} pers.</span>
                        <span class="difficulty ${recipe.difficulty}">${formatDifficulty(recipe.difficulty)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

class RecipeDetail {
    constructor() {
        this.recipe = null;
        this.init();
    }

    async init() {
        const slug = this.getRecipeSlug();
        await this.loadRecipe(slug);
        this.renderRecipe();
        this.setupInteractions();
    }

    getRecipeSlug() {
        return window.location.pathname.split('/').pop();
    }

    async loadRecipe(slug) {
        try {
            const response = await fetch(`/api/recipes/${slug}`);
            const data = await response.json();
            this.recipe = data.recipe;
        } catch (error) {
            console.error('Erreur chargement recette:', error);
            this.showError();
        }
    }

    renderRecipe() {
        if (!this.recipe) return;

        document.title = `${this.recipe.title} - Recettes du Maroc`;
        
        const container = document.getElementById('recipeContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="recipe-header">
                <div class="recipe-image-large">
                    <img src="${this.recipe.image_url}" alt="${this.recipe.title}">
                </div>
                <div class="recipe-info">
                    <h1>${this.recipe.title}</h1>
                    <p class="recipe-description">${this.recipe.description}</p>
                    <div class="recipe-stats">
                        <div class="stat">
                            <i class="fas fa-clock"></i>
                            <span>Préparation: ${this.recipe.prep_time}min</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-fire"></i>
                            <span>Cuisson: ${this.recipe.cook_time}min</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-users"></i>
                            <span>${this.recipe.servings} personnes</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-signal"></i>
                            <span>${formatDifficulty(this.recipe.difficulty)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="recipe-content">
                <div class="ingredients-section">
                    <h2><i class="fas fa-list"></i> Ingrédients</h2>
                    <div class="ingredients-list">
                        ${this.renderIngredients()}
                    </div>
                </div>

                <div class="instructions-section">
                    <h2><i class="fas fa-tasks"></i> Instructions</h2>
                    <div class="instructions-list">
                        ${this.renderInstructions()}
                    </div>
                </div>
            </div>
        `;
    }

    renderIngredients() {
        if (!this.recipe.content?.ingredients) return '';
        
        return this.recipe.content.ingredients.map(group => `
            <div class="ingredient-group">
                ${group.group ? `<h4>${group.group}</h4>` : ''}
                <ul>
                    ${group.items.map(item => `
                        <li>
                            <label>
                                <input type="checkbox">
                                <span>${item.text}</span>
                            </label>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    }

    renderInstructions() {
        if (!this.recipe.content?.instructions) return '';
        
        return this.recipe.content.instructions.map((step, index) => `
            <div class="instruction-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                    <h4>${step.name}</h4>
                    <p>${step.text}</p>
                </div>
            </div>
        `).join('');
    }

    setupInteractions() {
        // Checkbox ingrédients
        document.querySelectorAll('.ingredients-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.target.closest('li').classList.toggle('checked', e.target.checked);
            });
        });
    }

    showError() {
        const container = document.getElementById('recipeContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 20px;"></i>
                    <h2>Recette introuvable</h2>
                    <p>Cette recette n'existe pas ou a été supprimée</p>
                    <button class="btn btn-primary" onclick="navigateTo('/recipes')">
                        Voir toutes les recettes
                    </button>
                </div>
            `;
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RecipeApp();
    
    // Initialiser la page appropriée
    const page = window.app.currentPage;
    
    if (page === 'recipes-list') {
        window.recipesList = new RecipesList();
    } else if (page === 'recipe-detail') {
        window.recipeDetail = new RecipeDetail();
    }
});
