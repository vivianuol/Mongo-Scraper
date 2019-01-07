$(document).ready(function () {
    // Setting a reference to the article-container div where all the dynamic content will go
    // Adding event listeners to any dynamically generated "save article"
    // and "scrape new article" buttons
    var articleContainer = $("#article_cont");
    // $(document).on("click", ".btn.save", articleSave);

    //handle unsaved articles log on page
    function initPage() {
        // Run an AJAX request for any unsaved headlines
        $.get("/api/scrape").then(function (data) {
            articleContainer.empty();
            // If we have headlines, render them to the page
            if (data && data.length) {
                renderArticles(data);
            } else {
                // Otherwise render a message explaining we have no articles
                renderEmpty();
            }
        });
    }


    function createArticle(article) {
        // This function takes in a single JSON object for an article/headline
        // It constructs a jQuery element containing all of the formatted HTML for the create each article.
        var eachArticle = $("<div class='article'>");

        var articleTitle = $("<div class='article-header'>")

        var articleContent = $("<a class='article-link' target='_blank' rel='noopener noreferrer'>");
        articleContent
            .attr("href", article.url)
            .text(article.headline);
            
        var articleBody = $("<h3>").append(articleContent);

        var saveArticleBtn = $("<a class='btn btn-success save'>Save Article</a>");

        eachArticle.append(articleTitle,
            articleBody,
            saveArticleBtn);

    };



    $("#clear").on("click", function () {
        // console.log("clear clicked");
        // $.get("/api/clear").then(function (data) {
        // console.log(data);
        articleContainer.empty();
        // initPage();
        renderEmpty();

    });

    function renderEmpty() {
        // This function renders some HTML to the page explaining we don't have any articles to view
        // Using a joined array of HTML string data because it's easier to read/change than a concatenated string
        var html = $("<div>")
        var scrapenew = $("<h4>")
        scrapenew.append("<a class='scrape-new' href='javascript:void(0)' >Try Scraping New Articles</a>")

        console.log(scrapenew)

        var saved = $("<h4><a href='/saved'>Go to Saved Articles</a></h4>")

        html.append("<h4>Uh Oh. Looks like we don't have any new articles.</h4>").append("<h3>What Would You Like To Do?</h3>").append(scrapenew).append(saved)

        console.log(html);
        // Appending this data to the page
        articleContainer.append(html);
    }

    function renderArticles() {
        $.get("/api/scrape", function (data) {
            console.log("data: " + data);
            for (var i = 0; i < data.length; i++) {
                if (data[i].headline) {
                    var title = $("<h3>" + data[i].headline + "</h3>");
                    var body = $("<p>" + data[i].summary + "</p>");
                    var saveBtn = $("<button class='save'>save article</button>")
                    var singleArticle = $("<div>"); singleArticle.attr("class", "single-article");
                    singleArticle.append(title, saveBtn, body)
                    $("#article_cont").append(singleArticle);
                }
            }

        });
    }



    $(document).on("click", ".scrape-new", function (e) {
        e.preventDefault();

        console.log("scrape-new on clicked")

        articleContainer.empty();
        // console.log(".scrape-new on clicked")
        renderArticles();
    });

    $(document).on("click", ".save", function (e) {
        e.preventDefault();
        var title = $(this).siblings('h3').text();
        console.log("title: " + title);
        var body = $(this).siblings('p').text();
        console.log("body: " + body);
        $.post("/api/articles", { "headline": title, "summary": body }, function (results) {
            console.log("results: " + results);
        })

        $(this).parent().remove();
    })

    $(document).on("click", ".delete", function (e) {
        e.preventDefault();
        console.log("delete article from DOM")
        var id = $(this).parent().parent().parent().attr("data-_id");
        console.log(id);

        $.ajax({
            type: 'DELETE',
            url: "/article/delete/" + id
        })
            .then(function () {
                console.log("Article deleted successfully")
            });
        
        $(this).parent().parent().parent().remove();
    });


$(document).on("click", ".notes", function (e) {
    e.preventDefault();
    console.log("popup note modal")

    var id = $(this).parent().parent().parent().attr("data-_id");
    console.log(id);

    $(this).parent().parent().siblings(".modal-dialog").show();

    
})

$(document).on("click", ".save_note", function (e) {
    e.preventDefault();
    
    console.log(this);

    $(this).siblings(".list-group").children(".list-group-item").remove();

    console.log("add new note to article");

    var thisId = $(this).siblings("h4").children("span").text();
    console.log("id: " + thisId);
    var savedNote = $(this).siblings("textarea").val();
    console.log("saveNote: " + savedNote);

    var currentBtn = $(this);

    $.post("/articles/" + thisId, { "noteContent": savedNote}, function (noteback) {

        console.log("noteback: " + noteback.noteContent);

        var noteItem = $("<li class='note-item'>" + noteback.noteContent +"</li>");
        console.log(noteItem);
        
        currentBtn.siblings(".list-group").append(noteItem);
    })

    $(this).siblings("textarea").val("");
})

$(document).on("click", ".close", function (e) {

    e.preventDefault();
    console.log("close the note modal")
    $(this).parent().parent().parent().hide();
})

$("#Home").on("click", function (e) {
    e.preventDefault();
    window.location.replace("/");
})
});
