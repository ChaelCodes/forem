describe('Pin an article from the admin area', () => {
  beforeEach(() => {
    cy.testSetup();
    cy.fixture('users/adminUser.json').as('user');

    cy.get('@user').then((user) => {
      cy.loginAndVisit(user, '/').then(() => {
        cy.createArticle({
          title: 'Test Article',
          tags: ['beginner', 'ruby', 'go'],
          content: `This is a test article's contents.`,
          published: true,
        }).then(() => {
          cy.createArticle({
            title: 'Test Another Article',
            tags: ['beginner', 'ruby', 'go'],
            content: `This is another test article's contents.`,
            published: true,
          }).then(() => {
            cy.visit('/admin/content_manager/articles');
          });
        });
      });
    });
  });

  it('should pin an article when no other article is currently pinned', () => {
    // Simulate that there is no existing pinned post
    cy.intercept(`${Cypress.config().baseUrl}/stories/feed/pinned_article`, {
      statusCode: 404,
    });

    cy.findAllByRole('button', { name: 'Pin Post' }).first().click();

    // Verify that the form has submitted and the page has changed to the post page
    cy.url().should('contain', '/content_manager/articles/');

    cy.findByRole('button', { name: 'Pin Post' }).should('not.exist');
    cy.findByRole('link', { name: 'Unpin Post' }).should('exist');
    cy.findByText(/Pinned post/i).should('exist');
  });

  it('should display a warning modal when pinning an article, and one is already pinned', () => {
    cy.findAllByRole('button', { name: 'Pin Post' }).first().click();

    cy.createArticle({
      title: 'A new article',
      tags: ['beginner', 'ruby', 'go'],
      content: `This is another test article's contents.`,
      published: true,
    }).then((response) => {
      cy.visit(`/admin/content_manager/articles/${response.body.id}`);
    });

    cy.findByRole('main')
      .first()
      .within(() => {
        cy.findAllByRole('button', { name: 'Pin Post' }).last().click();
      });

    cy.findByRole('dialog').within(() => {
      cy.findByRole('heading', {
        name: "There's another article pinned...",
        level: 2,
      });
    });
  });

  it('should change the pinned article when choosing to pin a new article', () => {
    cy.findAllByRole('button', { name: 'Pin Post' }).first().click();

    cy.createArticle({
      title: 'A new article',
      tags: ['beginner', 'ruby', 'go'],
      content: `This is another test article's contents.`,
      published: true,
    }).then((response) => {
      cy.visit(`/admin/content_manager/articles/${response.body.id}`);
    });

    cy.findByRole('main')
      .first()
      .within(() => {
        cy.findAllByRole('button', { name: 'Pin Post' }).last().click();
      });

    cy.findByRole('dialog').within(() => {
      cy.findByRole('button', { name: 'Pin new article' }).click();
    });

    cy.findByRole('main').within(() => {
      cy.findByText(/A new article/i).should('exist');
      cy.findByText(/Pinned post/i).should('exist');
    });
  });

  it('should show the pinned post to a logged out user', () => {
    cy.findAllByRole('button', { name: 'Pin Post' }).first().click();

    cy.signOutUser();

    cy.findByRole('main').findByTestId('pinned-article').should('be.visible');
  });
});