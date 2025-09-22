bundle lock --add-platform x86_64-linux --add-platform ruby
rm Gemfile.lock
bundle install
bundle lock --add-platform x86_64-linux --add-platform ruby