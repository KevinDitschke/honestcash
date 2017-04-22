import './styles/style.css';

// import angular from 'angular';
import 'jquery';
import uiRouter from 'angular-ui-router';
import infiniteScroll from  'ng-infinite-scroll';
import ProfileCtrl from './controllers/ProfileCtrl';
import FeedsCtrl from './controllers/FeedsCtrl';
import WelcomeCtrl from './controllers/WelcomeCtrl';
import DraftsCtrl from './controllers/DraftsCtrl';
import EditorCtrl from './controllers/EditorCtrl';
import routingConfig from './config/routing';
import httpConfig from './config/http';
import stateConfig from './config/state';
import feedComponent from './components/feed/component';

var imageDropzone, profilePicDropzone, hashbookBGDropzone;
var vicigoApp = angular.module("hashtag-app", [ uiRouter, 'ui.bootstrap', infiniteScroll, "dcbImgFallback", "xeditable", "angular-inview", '720kb.socialshare', 'ngDialog', "angular.lazyimg", "ViciAuth"])

.constant("API_URL", "")
.run(function(ngDialog) {
	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) {
			return;
		}
		js = d.createElement(s);
		js.id = id;
		js.src = "//connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));

	(function(i, s, o, g, r, a, m) {
		i['GoogleAnalyticsObject'] = r;
		i[r] = i[r] || function() {
			(i[r].q = i[r].q || []).push(arguments)
		}, i[r].l = 1 * new Date();
		a = s.createElement(o),
			m = s.getElementsByTagName(o)[0];
		a.async = 1;
		a.src = g;
		m.parentNode.insertBefore(a, m)
	})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
	ga('create', 'UA-61717055-1', 'auto');

})
.run(function($rootScope, $window, $location) {
	$window.fbAsyncInit = function() {
		FB.init({
			appId: '1577245229193798',
			status: true,
			cookie: true,
			xfbml: true,
			version: 'v2.4'
		});
	};
})
.run(function($rootScope, $window, $location) {
	$rootScope.$on('$stateChangeSuccess', function(event) {
		$window.ga('send', 'pageview', {
			page: $location.url()
		});
	});

})
.run(function(ViciAuth, Uploader) {

	Uploader.init();

	profilePicDropzone = new Dropzone("#profilePicDropzone", {
		url: "/upload/image?isProfileAvatar=true",
		maxFiles: 10,
		maxfilesexceeded: function(file) {
			this.removeAllFiles();
			this.addFile(file);
		},
		thumbnailWidth: null,
		previewTemplate: document.querySelector('#preview-template').innerHTML,
	}).on("sending", function(file, xhr) {
		xhr.setRequestHeader("X-Auth-Token", ViciAuth.getAuthToken());
	}).on("success", function(file, response) {
		$('#uploadProfilePicModal').modal('hide');
		document.getElementById("profilePic").src=response.link;
	});

	$(".tags-area").tagit({
		placeholderText: "tag it!",
	});
})
.run(function($rootScope, $state, $timeout, $http) {
	var fetchNotifs = function() {
		$http.get("/api/notifications/status").then(function(response) {
			$rootScope.userStatus = response.data;
			return;
		});
	};

	$rootScope.$on("notAuthenticated", function() {
		var WhiteListed = [ "starter.welcome", "vicigo.post", "vicigo.postByAlias", "vicigo.hashbook", "vicigo.hashtag" ];
		if (WhiteListed.indexOf($state.current.name) == -1) {
			$state.go("starter.welcome");
		}
	});
})

	.run(function(editableOptions) {
		editableOptions.theme = 'bs3';
	})

	.config(routingConfig)
	.config(httpConfig)
	.config(stateConfig)

	.service('MetaService', function() {
		var metaDefault = {
			title: "#vicigo",
			author: 'Vicigo',
			description: 'explore the world of hashtags - #vicigo makes it easy to browse the most interesting information, get your questions answered and share your own knowledge.',
			robots: 'index, follow',
			keywords: 'vicigo,viciqloud,hashtag,information,question,answer,social media,share,blog,post,technology',
			ogTitle: "#vicigo",
			ogSite_name: "Vicigo",
			ogUrl: "https://vicigo.com/",
			ogDescription: "explore the world of hashtags - #vicigo makes it easy to browse the most interesting information, get your questions answered and share your own knowledge.",
			fbAppId: 1577245229193798,
			ogType: "website",
			ogLocale: "locale",
			articlePublisher: "https://www.facebook.com/vvicigo",
			ogImage: "https://www.vicigo.com/img/fb_post.png",
			twitterTitle: "#vicigo",
			twitterUrl: "https://www.vicigo.com/",
			twitterDescription: "explore the world of hashtags",
		};
		var meta = metaDefault;


		var set = function(key, value) {
			meta[key] = value;
		};

		return {
			setDefault: function() {
				meta = metaDefault;
				return true;
			},

			setForPost: function(post) {
				set("author", post.author_name);
				var desc = post.hashtags.map(function(item) {
					return item.hashtag;
				}).join(", ");
				if (post.post_type_id == 4 || post.post_type_id == 5) {
					set("title", "Image on Vicigo by @" + post.author_name + " | Vicigo");
					set("ogTitle", "Image on Vicigo by @" + post.author_name);
					set("twitterTitle", "Image on Vicigo by @" + post.author_name);
					set("ogUrl", "https://vicigo.com/post/" + post.post_id);

					set("description", desc);
					set("keywords", desc);
					set("ogDescription", desc);
					set("twitterDescription", desc);
				} else {
					set("title", post.post_title + " by @" + post.author_name + " |  Vicigo");
					set("ogTitle", post.post_title + " by @" + post.author_name);
					set("twitterTitle", post.post_title + " by @" + post.author_name);


					set("description", desc);
					set("keywords", desc);
					set("ogDescription", desc);
					set("twitterDescription", desc);
				}

				set("ogImage", (post.post_image_url) ? post.post_image_url : metaDefault.ogImage);
				return true;
			},

			setForHashtag: function(hashtag) {
				meta = metaDefault;
				var title = "#" + hashtag + " | Vicigo photos and articles";
				var desc = "Photos, posts and articles with the hashtag '" + hashtag + "' on Vicigo.";
				set("ogUrl", "https://vicigo.com/hashtag/" + hashtag);
				set("title", title);
				set("ogTitle", title);
				set("twitterTitle", title);

				set("description", desc);
				set("keywords", desc);
				set("ogDescription", desc);
				set("twitterDescription", desc);
				return true;
			},

			setForProfile: function(profile) {
				meta = metaDefault;
				var keywords = profile.hashtags.map(function(item) {
					return item.hashtag;
				}).join(", ");
				var title = "@" + profile.name;
				title += (profile.title) ? (", " + profile.title) : "";
				title += "  | Vicigo";

				var desc = "The newest photos and articles from @" + profile.name + "."
				desc += (profile.title) ? " " + profile.title : "";
				desc += " " + keywords;

				set("title", title);
				set("ogTitle", title);
				set("twitterTitle", title);
				set("ogUrl", "https://vicigo.com/profile/" + profile.user_id);
				set("description", desc);
				set("keywords", keywords);
				set("ogDescription", desc);
				set("twitterDescription", desc);
				return true;
			},

			display: function(key) {
				return meta[key];
			},
		}
	})

.service("Uploader", function($http, ViciAuth) {
	var PATHS = {
		IMAGE: "/upload/image"
	};

	var changeProgress = function(progressValue) {
		document.getElementById("imageUploadProgressBar").setAttribute("aria-valuenow", progressValue);
		document.getElementById("imageUploadProgressBar").style.width = progressValue + "%";
	}

	var init = function() {
		imageDropzone = new Dropzone("body", {
				url: PATHS.IMAGE,
				maxFiles: 10,
				thumbnailWidth: null,
				previewTemplate: document.querySelector('#preview-template').innerHTML,
				clickable: '#imageDropzone',
			})
			.on("addedfile", function(file) {
				$('#uploadImageModal').modal('show');
				$('#uploadedImage').attr('src', null);
				$(".tags-area").tagit("removeAll");
				//imageDropzone.removeAllFiles(true);
				$(".dz-message").removeClass("hidden");
				$("#uploadedImage").addClass("hidden");
			})
			.on("sending", function(file, xhr) {
				changeProgress(0);
				$("#imageUploadProgress").removeClass("hidden");
				xhr.setRequestHeader("X-Auth-Token", ViciAuth.getAuthToken());
			}).on("uploadprogress", function(file, progress) {
				changeProgress(progress);
			}).on("success", function(file, response) {
				changeProgress(100);
				setTimeout(function() {
					$("#imageUploadProgress").addClass("hidden");
				}, 500);

				document.getElementById("uploadedImage").src = response.link;
				$("#uploadedImagePostId").val(response.postId)
				document.getElementById("publishPicturePostBtn").disabled = false;
				$(".dz-message").addClass("hidden");
				$("#uploadedImage").removeClass("hidden");
			});
	};

	return {
		init: init
	};
})

.service("CommentService", function($http) {
	var deleteComment = function(postId, commentId) {
		$http.delete("/api/post/" + postId + "/comments/" + commentId).then(function(response) {
		});
	};

	var getComments = function(postId, callback) {
		$http.get("/api/post/" + postId + "/comments").then(function(response) {
			callback(response.data);
		});
	};

	var postComment = function(postId, commentBody, callback) {
		if (!postId || !commentBody) {
			return
		}
		var comment = {
			postId: postId,
			body: commentBody,
		};
		$http.post("/api/post/" + postId + "/comments/", comment).then(function(response) {
			callback(response.data);
		});
	}

	return {
		postComment: postComment,
		getComments: getComments,
		deleteComment: deleteComment
	};
})

.service("HashbookService", function($http, API_URL) {
	var getHashbooks = function(profileId, params, callback) {
		$http({
			url: API_URL + "/api/profile/" + profileId + "/hashbooks",
			method: "GET",
			params: params
		}).then(function(response) {
			callback(response.data);
		});
	};
	return {
		getHashbooks: getHashbooks
	};
})

.service("RelsService", function($http, API_URL) {

	var followProfile = function(profileId) {
		$http.post(API_URL + "/api/profile/" + profileId + "/follow/").then(function(response) {
			
		});
	};
	var unfollowProfile = function(profileId) {
		$http.post(API_URL + "/api/profile/" + profileId + "/unfollow/").then(function(response) {
			
		});
	};

	var showFollowers = function(profileId, callback) {
		$http.get(API_URL + "/api/profile/" + profileId + "/followers").then(function(response) {
			
			callback(response.data);
		});
	};

	var showFollowing = function(profileId, callback) {
		$http.get(API_URL + "/api/profile/" + profileId + "/following").then(function(response) {
			
			callback(response.data);
		});
	};

	var followHashtag = function(hashtag) {
		$http.get(API_URL + "/api/hashtag/" + hashtag + "/follow").then(function(response) {
			
		});
	};

	var unfollowHashtag = function(hashtag) {
		$http.get(API_URL + "/api/hashtag/" + hashtag + "/unfollow").then(function(response) {
			
		});
	};

	var showFollowedHashtags = function(profileId, callback) {
		$http.get(API_URL + "/api/profile/" + profileId + "/hashtags/following").then(function(response) {
			
			callback(response.data)
		});
	};



	return {
		followHashtag: followHashtag,
		unfollowHashtag: unfollowHashtag,
		followProfile: followProfile,
		unfollowProfile: unfollowProfile,
		showFollowing: showFollowing,
		showFollowers: showFollowers,
		showFollowedHashtags: showFollowedHashtags,
	};
})


.service("PostService", function($http, $sce, API_URL) {

		var removePost = function(postId) {
			return $http.delete(API_URL + "/api/post/" + postId);
		};



		var getById = function(postId, callback) {
			return $http.get(API_URL + "/api/post/" + postId).then(function(response) {
				callback(response.data);
			});
		}

		var getByAlias = function(username, alias, callback) {
			return $http.get(API_URL + "/api/post/" + username + "/" + alias).then(function(response) {
				callback(response.data);
			});
		}
		var displayHTML = function(html) {
			return $sce.trustAsHtml(html);
		};


		var publishPic = function(postId, params, callback) {
			$http.put(API_URL + "/api/post/image/publish", {
				postId: postId,
				tags: params.hashtags
			}).then(function(response) {
				callback(response.data);
			});
		};


		var upvote = function(postId) {
			$http.post(API_URL + "/api/post/" + postId + "/upvote").then(function(response) {
				
			});
		};
		var downvote = function(postId) {
			$http.post(API_URL + "/api/post/" + postId + "/downvote").then(function(response) {
				
			});
		};

		var getUpvotes = function(postId, callback) {
			$http.get(API_URL + "/api/post/" + postId + "/upvotes").then(function(response) {
				callback(response.data);
			});
		};

		var getViews = function(postId, callback) {
			$http.get(API_URL + "/api/post/" + postId + "/views").then(function(response) {
				callback(response.data);
			});
		};

		return {
			getViews: getViews,
			getUpvotes: getUpvotes,
			publishPic: publishPic,
			getById: getById,
			getByAlias: getByAlias,
			removePost: removePost,
			upvote: upvote,
			downvote: downvote,
			displayHTML: displayHTML
		};

	})
	.service("FeedService", function($http, API_URL) {

		var fetchFeeds = function(query, callback) {
			$http({
				url: API_URL + "/api/feeds",
				method: "GET",
				params: {
					hashtag: query.hashtag,
					sort: query.sort,
					filter: query.filter,
					page: (query.page) ? query.page : 1,
					profileId: query.profileId,
					algorithm: query.algorithm
				}
			}).then(function(response) {
				
				callback(response.data);
			});
		};

		return {
			fetchFeeds: fetchFeeds
		};

	})

.factory('AuthInterceptor', function($rootScope, $q) {

	if ($rootScope.activeCalls == undefined) {
		$rootScope.activeCalls = 0;
	}

	return {
		request: function(config) {
			$rootScope.activeCalls += 1;
			return config;
		},
		requestError: function(rejection) {
			$rootScope.activeCalls -= 1;
			return $q.reject(rejection);
		},
		response: function(response) {
			$rootScope.activeCalls -= 1;
			return response;
		},
		responseError: function(response) {
			$rootScope.activeCalls -= 1;
			if (response.status == 400 && response.data) {
				if (response.data.code == "POST_TOO_SHORT") {
					toastr.info("Post is too short. The minimal amount of charackters is 300. Current: " + response.data.textLength);
				}
			}

			if (response.status == 401) {
				$rootScope.$broadcast("notAuthenticated");
			}

			return $q.reject(response);
		}
	};
})


.controller("appController", function($scope, ViciAuth, PostService) {
	$scope.AUTH_TOKEN = ViciAuth.getAuthToken();
})

.controller("chatController", function($rootScope, $stateParams, $scope, $state, $http, $sce) {
	$scope.message = "";
	$scope.messages = [];
	var socket = io();
	alert($rootScope.user.id);
	socket.emit('chatJoined', {
		senderId: $rootScope.user.id,
		receiverId: $stateParams.userId
	});

	socket.on('chatMessage', function(msg) {
		$scope.messages.push(msg);
	});



	$scope.submitMessage = function(message) {
		socket.emit('chatMessage', message);
		$scope.messages.push(message);
		$scope.message = "";

		return false;
	};

})

.controller("blogController", function($rootScope, $stateParams, $scope, $state, $http, CommentService, PostService) {

		$scope.blogSlug = $stateParams.blogSlug;
		$scope.blog = {};




		$scope.followHashbook = function(hashbook) {
			if (!$rootScope.user.id) {

				bootbox.prompt("<b>What is your email?</b>", function(result) {
					$http.post("/api/hashbook/" + hashbook.blog_id + "/follow?medium=email&source=hashbook_page", {
						email: result
					})
				});
			} else {
				$http.post("/api/hashbook/" + $scope.blog.blog_id + "/follow?medium=vicigo&source=hashbook_page").then(function(response) {
					$scope.blog.blogFollowed = true;
					
				});

			}

		};


		$http.get("/api/hashbook/" + $scope.blogSlug).then(function(response) {
			
			$scope.blog = response.data;
		});


			hashbookBGDropzone = new Dropzone("#hashbookBGDropzone", {
				url: "/upload/image?isBackground=true&hashbookId="+$scope.blog.blog_id,
				maxFiles: 1,
				thumbnailWidth: null,
				previewTemplate: document.querySelector('#preview-template').innerHTML,
				clickable: '#hashbookBGDropzone'
			});
			hashbookBGDropzone.on("success", function(file, response) {
				$scope.blog.bg_picture = response.link;
			});

			/* repeting */
			$scope.upvotePost = function(postId, index) {
				if (!$rootScope.user.id) {
					return $("#loginModal").modal();
				}
				$scope.blog.posts[index].upvotes_count = $scope.blog.posts[index].upvotes_count + 1;
				$scope.blog.posts[index].alreadyUpvoted = true;
				PostService.upvote(postId);
			};

			$scope.showComments = function(postId, index) {
				if ($scope.feeds[index].showComments) {
					$scope.feeds[index].showComments = false;
				} else {
					CommentService.getComments(postId, function(rComments) {
						$scope.feeds[index].showComments = true;
						$scope.feeds[index].comments = rComments;
					});
				}
			};

			$scope.postComment = function(postId, body, index) {

				$scope.feeds[index].commentDraft = "";
				CommentService.postComment(postId, body, function(rComment) {
					$scope.feeds[index].showComments = true;
					$scope.feeds[index].comments.unshift(rComment);
				});
			};

			$scope.deleteComment = function(postId, commentId, feedIndex, commentIndex) {
				$scope.feeds[feedIndex].comments.splice(commentIndex, 1);
				CommentService.deleteComment(postId, commentId);
			};
	
		$scope.displayPostBody = PostService.displayHTML;
	
		})

	.controller("blogEditController", function($rootScope, $stateParams, $scope, $state, $http, $sce) {
		$(".tags-area").tagit();

		$scope.blogSlug = $stateParams.blogSlug;
		$scope.blog = {};

		$http.get("/api/hashbook/" + $scope.blogSlug + "?fields=hashtags").then(function(response) {
			$scope.blog = response.data;
			var hashtags = $scope.blog._hashtags;
			for (var index = 0; index < hashtags.length; index++) {
				$(".tags-area").tagit("createTag", hashtags[index].hashtag);
			}
		});


		$scope.updateBlog = function(data) {

			data = {
				title: data.blog_title,
				desc: data.blog_desc,
				hashtags: data.hashtags
			};

			$http.put("/api/hashbook/" + $scope.blogSlug, data).then(function(response) {
				
				$state.go("hashbook.list", {
					blogSlug: $scope.blogSlug
				});
			}, function(response) {
				
			});
		};
	})

.controller("blogNewController", function($rootScope, $scope, $state, $http) {
		$(".tags-area").tagit({
			placeholderText: "place for hashtags!"
		});


		$scope.blog = {
			slug: null,
			title: null,
			desc: null,
			hashtags: null,
			type: "blog"
		};
		$scope.createBlog = function(blog) {
			if (!blog.title) {
				return false;
			}
			if (!blog.hashtags) {
				return false;
			}

			$http.post("/api/hashbook", blog).then(function(response) {
				
				$scope.data = response.data;
				$state.go("hashbook.list", {
					blogSlug: $scope.blog.slug
				});
			});
		}
	})
	.controller("importController", function($rootScope, $scope, $state, $http) {
		$(".tags-area").tagit({
			placeholderText: "place for hashtags!"
		});
		$scope.data = [];
		$scope.activePost = false;
		$http.get("/api/external_services/fb/fetch_photos").then(function(response) {
			
			$scope.data = response.data;
		});

		$scope.selectedImageUrl = "";
		$scope.tagExternalPost = function(item) {
			$('#uploadExternalImageModal').modal('show');
			$scope.selectedImageUrl = item.source;
			$scope.activePost = item;



		};

		$scope.publishExternalPost = function() {

			var index = $scope.data.indexOf($scope.activePost);
			$scope.data.splice(index, 1);

			$('#uploadExternalImageModal').modal('hide');
			var hashtags = $("#hashtagsForImportedPhoto").val();

			var post = angular.copy($scope.activePost);

			post.tags = hashtags;
			$http.post("/api/post/image/from_link", post).then(function(response) {
				
				$(".tags-area2").tagit("removeAll");

			});
		};

	})

.controller("userListCtrl", function($rootScope, $scope, $uibModalInstance, postId, statType, stats, PostService) {

		$scope.stats = stats;

		$scope.cancel = function() {
			$uibModalInstance.dismiss('cancel');
		};





		$scope.showItems = function(type) {
			$scope.statType = type;
			if (type == "upvotes") {
				PostService.getUpvotes(postId, function(rPostUpvotes) {
					$scope.items = rPostUpvotes;
				});

			}
			if (type == "views") {
				PostService.getViews(postId, function(rPostViews) {
					$scope.items = rPostViews;
				});
			}
		};

		if (stats.upvotesCount) {
			$scope.showItems("upvotes");
		} else {
			$scope.showItems("views");
		}

		$rootScope.$on('$stateChangeStart', function() {
			$scope.cancel();
		});
	})
	.controller("mainController", function($rootScope, $scope, $state, $sce, $window, $location, $http, ViciAuth, MetaService, PostService, $uibModal) {
		$http.get("/api/hashtags/trending").then(function(response) {
			$scope.hashtags = response.data.map(function(item) {
				return item.hashtag
			});
		});

		$scope.showUpvotes = function(feed, statType) {
			PostService.getUpvotes(feed.id, function(rPostUpvotes) {
				var modalInstance = $uibModal.open({
					animation: $scope.animationsEnabled,
					templateUrl: 'userListModal.html',
					controller: 'userListCtrl',
					resolve: {
						statType: statType,
						postId: feed.id,
						stats: function() {
							return {
								upvotesCount: feed.upvotes_count,
								viewsCount: feed.views_count,
								commentsCount: feed.comment_count
							};
						},
						postUpvotes: function() {
							return rPostUpvotes;
						}
					}
				});
			});
		};

		$rootScope.MetaService = MetaService;

		$rootScope.trustSrc = function(src) {
			return $sce.trustAsResourceUrl(src);
		}

		$scope.goToPost = function(feed) {
			$state.go("vicigo.post", {
				postId: feed.id
			})
		};

		$rootScope.fbLogin = function(redirectOnSuccess) {
			ViciAuth.fbAuth(function(rUser) {
				$("#loginModal").modal('hide');
				$rootScope.user = {
					id: rUser.userId
				};
				$state.go("vicigo.feeds");
			});
		}

		$rootScope.searchVicigo = function(searchInput) {
			searchInput = searchInput.toLowerCase();
			searchInput = searchInput.replace('#', '');
			searchInput = searchInput.replace('@', '');

			return $http.get('/api/search?q=' + searchInput).then(function(response) {
				return response.data.map(function(item) {
					return item;
				});
			});
		};

		$rootScope.searchResultSelected = function($item) {
			switch ($item.type) {
				case "profile":
					$state.go("vicigo.profile", {
						profileId: $item.objId
					});
					break;
				case "post":
					$state.go("vicigo.post", {
						postId: $item.objId
					});
					break;
				case "hashtag":
					$state.go("vicigo.hashtag", {
						hashtag: $item.objId
					});
					break;
				default:
			}
		};

		$scope.sort = function(sortType) {
			if (sortType == $scope.sortType) {
				$window.location.reload();
			} else {
				$scope.sortType = sortType;
				$scope.postsAvailable = true;
				$location.search('sort', $scope.sortType);
			}
		};

		$scope.newPhoto = function() {
			$('#uploadImageModal').modal('show');
			$('#uploadedImage').attr('src', null);
			$(".tags-area").tagit("removeAll");
			//imageDropzone.removeAllFiles(true);
			$(".dz-message").removeClass("hidden");
			$("#uploadedImage").addClass("hidden");
		};

		$scope.editPhoto = function(feed) {
			$('#uploadImageModal').modal('show'); //uploadExternalImageModal
			$('#uploadedImage').attr('src', feed.image_url);

			$(".dz-message").addClass("hidden");
			$("#uploadedImage").removeClass("hidden");
			document.getElementById("publishPicturePostBtn").disabled = false;

			$(".tags-area").tagit("removeAll");
			feed.hashtags = (feed.hashtags) ? feed.hashtags : [];
			for (var index = 0; index < feed.hashtags.length; index++) {
				$(".tags-area").tagit("createTag", feed.hashtags[index].hashtag);
			}
			$("#uploadedImagePostId").val(feed.id);

			imageDropzone.removeAllFiles(true);
		};

		$scope.displayFeedBody = PostService.displayHTML;

		$scope.getFeedLink = function(feed) {
			return "/post/" + feed.id;
		};

		$scope.hasTitle = function(post_type_id) {
			if (post_type_id == 4) {
				return false;
			} else {
				return true;
			}
		};

		$rootScope.publishPicturePost = function() {
			var postId = $("#uploadedImagePostId").val();
			var tags = $("#uploadedPictureTags").val();
			$('#uploadImageModal').modal('toggle');

			if (postId) {
				PostService.publishPic(postId, {
					hashtags: tags
				}, function() {
					$(".dz-message").removeClass("hidden");
					$('#uploadedImage').attr('src', "");
					$("#uploadedPictureTags").tagit("removeAll");
					document.getElementById("publishPicturePostBtn").disabled = true;
					$(".dz-message").removeClass("hidden");
					$("#uploadedImage").addClass("hidden");
				});
			}

		};

		$rootScope.logoutMe = function() {
			ViciAuth.logout();
			
			$http.post("/viciauth/logout").then(function(response) {
				$rootScope.user = false;
				$rootScope.fetchingNotifs = false;

				$state.go("starter.welcome");
			});
		};
	})

.controller("postController", function($rootScope, $stateParams, $http, $scope, $sce, post, RelsService, CommentService) {
	$scope.postId = post.post_id;
	$scope.post = post;

	$scope.comments = [];

	$scope.follow = function(profileId) {
		if (!$rootScope.user.id) {
			return $("#loginModal").modal();
		}
		$scope.post.authorFollowed = true;
		RelsService.followProfile(profileId);
	};

	CommentService.getComments($scope.postId, function(rComments) {
		$scope.comments = rComments;
	});

	$scope.postComment = function(postId, body) {
		$scope.commentDraft = "";
		CommentService.postComment(postId, body, function(rComment) {
			$scope.comments.unshift(rComment);
		});
	};

	$scope.deleteComment = function(postId, commentId, commentIndex) {
		$scope.comments.splice(commentIndex, 1);
		CommentService.deleteComment(postId, commentId);
	};

	$scope.openShareModal = function(postId, commentId, commentIndex) {
		bootbox.confirm("Are you sure?", function(result) {
			if (result) {
				if (isDraft) $scope.drafts.splice($index, 1);
				else $scope.feeds.splice($index, 1);
				PostService.removePost(feed.id);
			}
		});
	};
})
.controller("profileBlogsController", function($scope, $stateParams, $http, HashbookService) {

	$scope.blogs = [];
	$scope.profileIdentifier = $stateParams.profileIdentifier;
	HashbookService.getHashbooks($scope.profileIdentifier, {}, function(rHashbooks) {
		$scope.blogs = rHashbooks;
	});

	$scope.deleteHashbook = function(blogId, blogSlug, $index) {

		bootbox.prompt("Do you really want to delete this Hashbook? You will not be able to revoke it. Write <b>'" + blogSlug.toUpperCase() + "'</b> to confirm.", function(result) {
			if (!result) return;
			if (result.toUpperCase() == blogSlug.toUpperCase()) {
				bootbox.confirm("Do you really really want irrevocablly to delete it? Sure? Second thoughts?", function(result) {
					if (result) {
						$http.delete("/api/hashbook/" + blogSlug);
						return $scope.blogs.splice($index, 1);
					} else {
						return;
					}

				});
			}
		});

	};

})

.service("ProfileService", function($http, API_URL) {

	var fetchProfile = function(profileId, callback) {
		$http.get(API_URL + "/api/profile/" + profileId).then(function(response) {
			
			callback(response.data);
		});
	};

	var fetchProfileStatus = function(query, callback) {
		$http({
			url: API_URL + "/api/profile/status",
			method: "GET",
			params: {

			}
		}).then(function(response) {
			
			callback(response.data);
		});
	};

		var fetchRecommentedProfiles = function(profileId,params,callback) {
		$http({
			url: API_URL + "/api/profile/"+profileId+"/recommented/accounts",
			method: "GET",
			params: params
		}).then(function(response) {
			
			callback(response.data);
		});
	};
	
	return {
		fetchProfileStatus: fetchProfileStatus,
		fetchProfile: fetchProfile,
		fetchRecommentedProfiles : fetchRecommentedProfiles
	};
})


.controller("discoverController", function($rootScope,$stateParams,$scope,ProfileService) {
		ProfileService.fetchRecommentedProfiles($stateParams.profileId,{},function(rProfiles){
			
		});
})	

.controller("notifsController", function($rootScope, $scope, notifs, $http) {
	$scope.notifs = notifs;
	$scope.page = 1;
	$scope.limit = 30;
	$rootScope.isLoading = true;
	$scope.postsAvailable = true;

	$scope.markAllNotifsAsRead = function() {
		$http.put("/api/notifications/read_all");
		if ($rootScope.userStatus) {
			$rootScope.userStatus.notifications_count = 0;
		}
		$scope.notifs = $scope.notifs.map(function(item) {
			item.status = 1;
			return item;
		});
	};

	$scope.markNotifAsRead = function(notif, index) {
		if (notif.status == 0) {
			$scope.notifs[index].status = 1;
			return $http.put("/api/notifications/read_one/" + notif.event_id);
		}

	};

	$scope.fetchNotifs = function(page, limit) {
		$http.get("/api/notifications?page=" + page + "&limit=" + limit).then(function(response) {
			response.data.forEach(function(feed) {
				$scope.notifs.push(feed);
			});

			if (response.data.length < $scope.limit) {
				$scope.postsAvailable = false;
			} else {
				$scope.postsAvailable = true;
			}
		});
	};



	$scope.loadMoreNotifs = function() {
		if (!$rootScope.activeCalls && $scope.postsAvailable) {
			$scope.page = $scope.page + 1;
			$scope.fetchNotifs($scope.page, $scope.limit);
		}
	};


	$scope.displayPost = function(notif) {
		if (notif.event_type == 2 && notif.post_type_id == 4) {
			return "pic";
		}
		if (notif.event_type == 2 && (notif.post_type_id == 3 || notif.post_type_id == 2)) {
			return 'post "' + notif.post_title + '"';
		}

		return "post";
	}
})
	.controller("profileController", ProfileCtrl)
	.controller("editorController", EditorCtrl)
	.controller("feedsController", FeedsCtrl)
	.controller("welcomeController", WelcomeCtrl)
	.controller("draftsController", DraftsCtrl)
	
	.run(function($rootScope, $state, ViciAuth) {
		$rootScope.$on('$stateChangeStart', function(event, next, nextParams, fromState) {
			if (next.name == "starter.welcome") {
				$rootScope.welcome = true;
			} else {
				$rootScope.welcome = false;
			}
			if (next.name == "starter.login" || next.name == "starter.signup" || next.name == "blog") {
				$rootScope.noHeader = true;
			} else {
				$rootScope.noHeader = false;
			}

			ViciAuth.validate(function(data) {
				if (data && data.userId) {
					var u = {
						id: data.userId,
						profileImageUrl: data.profileImageUrl,
						name: data.name
					};
					$rootScope.user = u;
				} else {
					$rootScope.user = false;
					if (next.name == "vicigo.feeds") {
						$state.go("starter.welcome");
					}
				}
			});

		});
	})
.directive('backImg', function() {
	return function(scope, element, attrs) {
		var url = attrs.backImg;
		element.css({
			'background-image': 'url(' + url + ')',
			'background-size': 'cover'
		});
	};
})
.directive('fallbackSrc', function() {
	var fallbackSrc = {
		link: function postLink(scope, iElement, iAttrs) {
			iElement.bind('error', function() {
				angular.element(this).attr("src", iAttrs.fallbackSrc);
			});
		}
	}
	return fallbackSrc;
})

.directive('feed', feedComponent)

.directive('postHeader', function() {
	return {
		templateUrl: '/templates/directives/postHeader.html'
	};
});