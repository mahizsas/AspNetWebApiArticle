﻿/// <reference path="scripts/jquery.js"/>
/// <reference path="scripts/ww.jquery.js"/>
/// <reference path="scripts/knockout-2.0.0.js" />
/// <reference path="scripts/knockout-mapping.js" />

page = {
    // display view for a single album instance
    albumView: null,
    // display view for a album array
    albumsView: null,
    // view for editing an album
    albumEditView: null,
    // flag that determines whether we're on the first bind
    editalbumFirstBind: true
}

$(document).ready(function () {
    page.initialize();
    page.hookupEvents();    
});

page.initialize = function () {   
    // status bar configuration (ww.jquery.js)
    showStatus({ autoClose: true });

    page.resizeFrame();
    setTimeout(function () { $(window).resize(page.resizeFrame) }, 30);

    // load albums when page loads
    page.loadAlbums(true);
}
page.hookupEvents = function() {
    // reload data from server
    $("#btnLoadData").click(page.loadAlbums);

    // Album click handling
    $(".albumlink,.album").live("click", page.loadAlbum);    

    // Delete button handling
    $(".removeimage").live("click", page.deleteAlbum);

    // post a static album to the server
    $("#btnSendAlbum").click(page.saveStaticAlbum)

    // show add new Album Window
    $("#btnAddNewAlbum").click(page.newAlbumDialog);

    $("#btnAddSong").click(page.addSong);

    $("#btnSaveAlbum").click(page.saveAlbum)

    $("#btnReloadAlbums").click(page.reloadAlbumsClick);
}
page.loadAlbums = function (showFirst) {

    $.getJSON("albums/", function (albums) {
        if (!page.albumsView) {
            // first time bind
            page.albumsView = ko.mapping.fromJS(albums);

            var view = { albums: page.albumsView };
            ko.applyBindings(view, $("#divAlbumContainer")[0]);
        }
        else
            ko.mapping.fromJS(albums, page.albumsView);

        var view = { albums: page.albumsView };

        // clear out list and make template visible
        var $albums = $(".album");
        //$albums.not(":first").remove();
        $albums.show();

        $("#divDialogStatus").text(albums.length + " albums");

        if (typeof (showFirst) == "boolean" && showFirst) {                       
            page.loadAlbum(albums[0].AlbumName);
        }
    });
}

page.loadAlbum = function (id) {
    if (typeof (id) != "string")
        id = $(this).data("id"); // title

    $.getJSON("albums/" + encodeURI(id), function (album) {
        var $dialog = $("#divAlbumDialog");
        if (!page.albumView) {
            page.albumView = ko.mapping.fromJS(album);
            ko.applyBindings(page.albumView, $dialog[0]);
        }
        else            
            ko.mapping.fromJS(album, page.albumView);
    });
}

page.getEmptyAlbum = function()  {    
    var obj =
    {
        AlbumName: "",
        Artist: "",
        YearReleased: 1970,
        AlbumImageUrl: "http://ecx.images-amazon.com/images/I/613yMZ7V32L._SL500_AA300_.jpg",
        AmazonUrl: "",
        Songs: [  ]
    }
    return obj;
}

page.newAlbumDialog = function () {
    $el = $("#divAddAlbumDialog");
    $el.show()
        .draggable()
        .closable()
        .centerInClient({ centerOnceOnly: true })

    // bind with empty data
    var data = page.getEmptyAlbum();
    
    // map to ko view model
    if (!page.albumEditView) {
        albumEditView = ko.mapping.fromJS(data);
        ko.applyBindings(albumEditView, $("#divAddAlbumDialog")[0]);
        //page.editalbumFirstBind = false;
    }
    else
        ko.mapping.fromJS(data, albumEditView);
}


page.deleteAlbum = function() {
    var $el = $(this).parent(".album");
    var txt = $el.find("a").text();
    $.ajax({
        url: "albums/" + encodeURIComponent(txt),
        type: "Delete",
        success: function (result) {
            $el.fadeOut().remove();
        },
        error: jqError
    });
}

page.saveStaticAlbum = function() {
    var id = new Date().getTime().toString();
    var album = {
        "Id": id,
        "AlbumName": "Power Age",
        "Artist": "AC/DC",
        "YearReleased": 1976,
        "Entered": "2002-03-11T18:24:43.5580794-10:00",
        "AlbumImageUrl": "http://ecx.images-amazon.com/images/I/510oasvdvsL._SL500_AA300_.jpg",
        "AmazonUrl": "http://www.amazon.com/gp/product/B00008WT5E/ref=as_li_ss_tl?ie=UTF8&tag=westwindtechn-20&linkCode=as2&camp=1789&creative=390957&creativeASIN=B00008WT5E",
        "Songs": [
            { "SongName": "Rock 'n Roll Damnation", "SongLength": 3.12},
            { "SongName": "Downpayment Blues", "SongLength": 4.22 },
            { "SongName": "Riff Raff", "SongLength": 2.42 }
        ]
    }

    $.ajax(
    {
        url: "albums/",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(album),
        processData: false,
        beforeSend: function (xhr) {
            // not really required since JSON is default output format
            xhr.setRequestHeader("Accept", "application/json");
        },
        success: function (result) {
            // reload list of albums
            page.loadAlbums();
        },
        error: jqError
    });
}
page.saveAlbum = function () {
    // turn into plain object
    var album = ko.toJS(albumEditView);

    $.ajax(
    {
        url: "albums/",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(album),
        processData: false,
        beforeSend: function (xhr) {
            // not required since JSON is default output
            xhr.setRequestHeader("Accept", "application/json");
        },
        success: function (result) {
            // reload list of albums
            page.loadAlbums();

            $("#divAddAlbumDialog").hide();
        },
        error: jqError
    });
}
page.addSong = function () {
    var name = $("#SongName").val();
    if (!name) {
        showStatus("Must provide a songname",4000);          
        $("#SongName").focus();
        return;
    }

    var song = { SongName: name , SongLength: $("#SongLength").val() };
    albumEditView.Songs.push(song);

    $("#SongName").val("").focus();
    $("#SongLength").val("")
}
page.reloadAlbumsClick =     function () {
    // force original albums to display            
    $.getJSON("albums/rpc/ResetAlbumData", function () {
        page.loadAlbums();
    });
}
page.resizeFrame = function () {
    var $main = $("#divMainContainer");
    $main.stretchToBottom();
    $("#divAlbumContainer,#divAlbumDialog").stretchToBottom({ container: $main });
    $(".scrollbox").stretchToBottom({ container: $("#divAlbumContainer"),bottomOffset: 20 });
}


function jqError(xhr, status,p3,p4) {    
    var error = JSON.parse(xhr.responseText);
    var err = error.message || error.Message || "Error";
    if (error.errors) {
        for (var i = 0; i < error.errors.length; i++) {
            err += "\r\n" + error.errors[i];
        }
    }
    showStatus(err, 4000);
}
