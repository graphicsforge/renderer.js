
render:
	mkdir -p bin
	browserify -r ./Renderer.js:renderer -o bin/renderer.min.js

clean:
	rm -rf ./bin/
